import {
  TechStackItem,
  TechStackCategory,
  TECH_COMPATIBILITY,
} from '../../../shared/types';
import * as techStackRepo from '../repositories/tech-stack.repository';

export interface CompatibilityResult {
  isCompatible: boolean;
  compatibleWith: string[];
  incompatibleWith: string[];
  warnings: string[];
}

/**
 * Check if a tech stack item is compatible with existing items
 */
export function checkCompatibility(
  newItem: { name: string; category: TechStackCategory },
  existingItems: TechStackItem[]
): CompatibilityResult {
  const result: CompatibilityResult = {
    isCompatible: true,
    compatibleWith: [],
    incompatibleWith: [],
    warnings: [],
  };

  // Get compatible technologies for the new item
  const compatibleTechs = TECH_COMPATIBILITY[newItem.name] || [];
  
  // If no compatibility rules defined, assume compatible with everything
  if (compatibleTechs.length === 0) {
    result.warnings.push(`No compatibility rules defined for ${newItem.name}`);
    return result;
  }

  // Check against existing items
  for (const existing of existingItems) {
    // Skip items in the same category (e.g., can have multiple frameworks)
    if (existing.category === newItem.category) continue;
    
    // Check if existing item is in the compatible list
    if (compatibleTechs.includes(existing.name)) {
      result.compatibleWith.push(existing.name);
    } else {
      // Check reverse compatibility
      const existingCompatible = TECH_COMPATIBILITY[existing.name] || [];
      if (!existingCompatible.includes(newItem.name) && existingCompatible.length > 0) {
        result.incompatibleWith.push(existing.name);
        result.isCompatible = false;
      }
    }
  }

  return result;
}


/**
 * Get compatibility suggestions for a category
 */
export function getCompatibilitySuggestions(
  category: TechStackCategory,
  existingItems: TechStackItem[]
): string[] {
  const suggestions: Set<string> = new Set();
  
  // Get all technologies that are compatible with existing items
  for (const item of existingItems) {
    const compatibleTechs = TECH_COMPATIBILITY[item.name] || [];
    compatibleTechs.forEach(tech => suggestions.add(tech));
  }
  
  // If no existing items, return all known technologies for the category
  if (existingItems.length === 0) {
    return Object.keys(TECH_COMPATIBILITY);
  }
  
  return Array.from(suggestions);
}

/**
 * Validate entire tech stack for compatibility
 */
export function validateTechStack(items: TechStackItem[]): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const otherItems = items.filter((_, idx) => idx !== i);
    const result = checkCompatibility(
      { name: item.name, category: item.category },
      otherItems
    );
    
    if (!result.isCompatible) {
      issues.push(
        `${item.name} is incompatible with: ${result.incompatibleWith.join(', ')}`
      );
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Lock project tech stack with validation
 */
export async function lockTechStack(
  projectId: string,
  lockedBy: string,
  userRole: string
): Promise<{
  success: boolean;
  items: TechStackItem[];
  error?: string;
}> {
  // Only Manager can lock tech stack
  if (userRole !== 'Manager' && userRole !== 'Admin') {
    return {
      success: false,
      items: [],
      error: 'Only Manager or Admin can lock tech stack',
    };
  }
  
  // Get current tech stack
  const items = await techStackRepo.findTechStackByProjectId(projectId);
  
  if (items.length === 0) {
    return {
      success: false,
      items: [],
      error: 'Cannot lock empty tech stack',
    };
  }
  
  // Validate compatibility before locking
  const validation = validateTechStack(items);
  if (!validation.isValid) {
    return {
      success: false,
      items,
      error: `Tech stack has compatibility issues: ${validation.issues.join('; ')}`,
    };
  }
  
  // Lock all items
  const lockedItems = await techStackRepo.lockProjectTechStack(projectId, lockedBy);
  
  return {
    success: true,
    items: lockedItems,
  };
}


/**
 * Unlock project tech stack (requires Manager approval)
 */
export async function unlockTechStack(
  projectId: string,
  userRole: string
): Promise<{
  success: boolean;
  items: TechStackItem[];
  error?: string;
}> {
  // Only Manager can unlock tech stack
  if (userRole !== 'Manager' && userRole !== 'Admin') {
    return {
      success: false,
      items: [],
      error: 'Only Manager or Admin can unlock tech stack',
    };
  }
  
  const items = await techStackRepo.unlockProjectTechStack(projectId);
  
  return {
    success: true,
    items,
  };
}

/**
 * Add tech stack item with compatibility check
 */
export async function addTechStackItem(
  input: techStackRepo.CreateTechStackInput
): Promise<{
  success: boolean;
  item?: TechStackItem;
  compatibility: CompatibilityResult;
  error?: string;
}> {
  // Check if tech stack is locked
  const isLocked = await techStackRepo.isProjectTechStackLocked(input.projectId);
  if (isLocked) {
    return {
      success: false,
      compatibility: {
        isCompatible: false,
        compatibleWith: [],
        incompatibleWith: [],
        warnings: [],
      },
      error: 'Tech stack is locked. Request Manager approval to make changes.',
    };
  }
  
  // Get existing items
  const existingItems = await techStackRepo.findTechStackByProjectId(input.projectId);
  
  // Check compatibility
  const compatibility = checkCompatibility(
    { name: input.name, category: input.category },
    existingItems
  );
  
  // Allow adding even if incompatible, but warn
  const item = await techStackRepo.createTechStackItem(input);
  
  return {
    success: true,
    item,
    compatibility,
  };
}

/**
 * Update tech stack item with lock check
 */
export async function updateTechStackItem(
  id: string,
  updates: { name?: string; version?: string },
  userRole: string
): Promise<{
  success: boolean;
  item?: TechStackItem;
  error?: string;
}> {
  const item = await techStackRepo.findTechStackItemById(id);
  
  if (!item) {
    return {
      success: false,
      error: 'Tech stack item not found',
    };
  }
  
  // Check if locked
  if (item.isLocked) {
    // Only Manager can update locked items
    if (userRole !== 'Manager' && userRole !== 'Admin') {
      return {
        success: false,
        error: 'Tech stack is locked. Only Manager or Admin can make changes.',
      };
    }
    
    // Unlock, update, then re-lock
    await techStackRepo.unlockTechStackItem(id);
    const updated = await techStackRepo.updateTechStackItem(id, updates);
    if (updated) {
      await techStackRepo.lockTechStackItem(id, item.lockedBy || 'system');
    }
    
    return {
      success: true,
      item: await techStackRepo.findTechStackItemById(id) || undefined,
    };
  }
  
  const updated = await techStackRepo.updateTechStackItem(id, updates);
  
  return {
    success: true,
    item: updated || undefined,
  };
}

/**
 * Remove tech stack item with lock check
 */
export async function removeTechStackItem(
  id: string,
  userRole: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const item = await techStackRepo.findTechStackItemById(id);
  
  if (!item) {
    return {
      success: false,
      error: 'Tech stack item not found',
    };
  }
  
  // Check if locked
  if (item.isLocked) {
    if (userRole !== 'Manager' && userRole !== 'Admin') {
      return {
        success: false,
        error: 'Tech stack is locked. Only Manager or Admin can remove items.',
      };
    }
    
    // Unlock before deleting
    await techStackRepo.unlockTechStackItem(id);
  }
  
  await techStackRepo.deleteTechStackItem(id);
  
  return {
    success: true,
  };
}

export default {
  checkCompatibility,
  getCompatibilitySuggestions,
  validateTechStack,
  lockTechStack,
  unlockTechStack,
  addTechStackItem,
  updateTechStackItem,
  removeTechStackItem,
};
