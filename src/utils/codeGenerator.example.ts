/**
 * Code Generator Usage Examples
 *
 * This file demonstrates how to use the CodeGenerator utility
 * for generating unique codes for different entities.
 */

import { CodeGenerator, CODE_CONFIGS } from './codeGenerator';

/**
 * Example 1: Generate code for a worker
 */
async function generateWorkerCode() {
  const workerCode = await CodeGenerator.generate('worker');
  console.log(workerCode); // Output: BSW-00001, BSW-00002, etc.
}

/**
 * Example 2: Generate code for a candidate
 */
async function generateCandidateCode() {
  const candidateCode = await CodeGenerator.generate('candidate');
  console.log(candidateCode); // Output: BSC-00001, BSC-00002, etc.
}

/**
 * Example 3: Generate code for an employer
 */
async function generateEmployerCode() {
  const employerCode = await CodeGenerator.generate('employer');
  console.log(employerCode); // Output: BSE-001, BSE-002, etc.
}

/**
 * Example 4: Generate code for a training batch
 */
async function generateTrainingCode() {
  const trainingCode = await CodeGenerator.generate('training');
  console.log(trainingCode); // Output: BST-001, BST-002, etc.
}

/**
 * Example 5: Generate code for a trainee/enrollment
 */
async function generateTraineeCode() {
  const traineeCode = await CodeGenerator.generate('trainee');
  console.log(traineeCode); // Output: BST-00001, BST-00002, etc.
}

/**
 * Example 6: Generate code for a project
 */
async function generateProjectCode() {
  const projectCode = await CodeGenerator.generate('project');
  console.log(projectCode); // Output: BSP-001, BSP-002, etc.
}

/**
 * Example 7: Validate a code
 */
function validateCode() {
  const isValid = CodeGenerator.validate('BSW-00001', 'worker');
  console.log(isValid); // Output: true

  const isInvalid = CodeGenerator.validate('BSW-001', 'worker'); // Wrong padding
  console.log(isInvalid); // Output: false
}

/**
 * Example 8: Parse code to get numeric part
 */
function parseCode() {
  const number = CodeGenerator.parseNumber('BSW-00001');
  console.log(number); // Output: 1
}

/**
 * Example 9: Get prefix for entity type
 */
function getPrefix() {
  const prefix = CodeGenerator.getPrefix('worker');
  console.log(prefix); // Output: BSW
}

/**
 * Example 10: Generate code with custom configuration
 */
async function generateCustomCode() {
  const customCode = await CodeGenerator.generateWithConfig({
    prefix: 'CUSTOM',
    padding: 4,
    tableName: 'custom_table',
    columnName: 'code',
  });
  console.log(customCode); // Output: CUSTOM-0001
}

/**
 * Example 11: Usage in a service
 */
class EmployerService {
  async createEmployer(data: any) {
    // Generate employer code
    const employerCode = await CodeGenerator.generate('employer');

    // Create employer with generated code
    const employer = {
      ...data,
      employer_code: employerCode, // BSE-001
    };

    // Save to database...
    return employer;
  }
}

/**
 * Example 12: Usage in a project creation
 */
class ProjectService {
  async createProject(data: any) {
    const projectCode = await CodeGenerator.generate('project');

    const project = {
      ...data,
      project_code: projectCode, // BSP-001
    };

    return project;
  }
}

/**
 * Example 13: Check available configurations
 */
function listConfigurations() {
  console.log('Available entity types and their configurations:');
  Object.entries(CODE_CONFIGS).forEach(([type, config]) => {
    console.log(`${type}:`, {
      prefix: config.prefix,
      padding: config.padding,
      example: `${config.prefix}-${'0'.repeat(config.padding - 1)}1`,
    });
  });

  // Output:
  // worker: { prefix: 'BSW', padding: 5, example: 'BSW-00001' }
  // candidate: { prefix: 'BSC', padding: 5, example: 'BSC-00001' }
  // employer: { prefix: 'BSE', padding: 3, example: 'BSE-001' }
  // training: { prefix: 'BST', padding: 3, example: 'BST-001' }
  // trainee: { prefix: 'BST', padding: 5, example: 'BST-00001' }
  // project: { prefix: 'BSP', padding: 3, example: 'BSP-001' }
}

export {
  generateWorkerCode,
  generateCandidateCode,
  generateEmployerCode,
  generateTrainingCode,
  generateTraineeCode,
  generateProjectCode,
  validateCode,
  parseCode,
  getPrefix,
  generateCustomCode,
  EmployerService,
  ProjectService,
  listConfigurations,
};
