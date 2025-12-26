// // @ts-nocheck
// import { env } from '@/config/env';
// import prisma from '@/config/prisma';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

// class WorkerDetailsService {
//   // Get profile by phone
//   async getProfileByPhone(phone: string) {
//     return await prisma.profile.findUnique({
//       where: { phone },
//     });
//   }

//   // Get employer by phone
//   async getEmployerByPhone(phone: string) {
//     return await prisma.employer.findFirst({
//       where: { phone },
//     });
//   }

//   // Get employer by email
//   async getEmployerByEmail(email: string) {
//     return await prisma.employer.findUnique({
//       where: { email },
//     });
//   }

//   // Get employer by employer_code (ID)
//   async getEmployerByCode(employerCode: string) {
//     return await prisma.employer.findUnique({
//       where: { employer_code: employerCode },
//     });
//   }

//   // Get user (team member) by email
//   async getUserByEmail(email: string) {
//     return await prisma.users.findUnique({
//       where: { email },
//       include: {
//         roles: true,
//       },
//     });
//   }

//   // Generate worker token
//   async generateWorkerToken(profileId: string) {
//     const profile = await prisma.profile.findUnique({
//       where: { id: profileId },
//       // COMMENTED OUT - Will implement project assignments later with different approach
//       // include: {
//       //   workerAssignments: {
//       //     where: {
//       //       status: {
//       //         in: ['allocated', 'active'],
//       //       },
//       //     },
//       //     include: {
//       //       projects: {
//       //         include: {
//       //           employers: true,
//       //         },
//       //       },
//       //     },
//       //     orderBy: {
//       //       deployment_date: 'desc',
//       //     },
//       //     take: 1,
//       //   },
//       // },
//     });

//     if (!profile) {
//       throw new Error('Profile not found');
//     }

//     const token = jwt.sign(
//       {
//         profileId: profile.id,
//         phone: profile.phone,
//         type: 'candidate',
//       },
//       env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     // COMMENTED OUT - Will implement project assignments later
//     // const currentAssignment = profile.project_worker_assignments[0];

//     return {
//       token,
//       worker: {
//         id: profile.id,
//         candidate_code: profile.candidate_code,
//         name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
//         phone: profile.phone,
//         current_assignment: null, // Temporary - will be implemented later
//         // current_assignment:
//         //   currentAssignment && currentAssignment.projects
//         //     ? {
//         //         project_name: currentAssignment.projects.name,
//         //         project_code: currentAssignment.projects.code,
//         //         employer_name: currentAssignment.projects.employers?.company_name,
//         //         status: currentAssignment.status,
//         //         deployment_date: currentAssignment.deployment_date,
//         //       }
//         //     : null,
//       },
//     };
//   }

//   // Login employer with password
//   async loginEmployerWithPassword(identifier: string, password: string) {
//     // Try to find employer by email or employer_code
//     let employer = await this.getEmployerByEmail(identifier);

//     if (!employer) {
//       employer = await this.getEmployerByCode(identifier);
//     }

//     if (!employer) {
//       throw new Error('Invalid credentials');
//     }

//     const isPasswordValid = await bcrypt.compare(password, employer.password_hash);

//     if (!isPasswordValid) {
//       throw new Error('Invalid credentials');
//     }

//     if (!employer.isActive) {
//       throw new Error('Account is inactive');
//     }

//     const token = jwt.sign(
//       {
//         employerId: employer.id,
//         email: employer.email,
//         type: 'employer',
//       },
//       env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     const { password_hash, ...employerData } = employer;

//     return {
//       token,
//       employer: employerData,
//     };
//   }

//   // Login employer with OTP (mobile)
//   async loginEmployerWithOTP(phone: string) {
//     const employer = await this.getEmployerByPhone(phone);

//     if (!employer) {
//       throw new Error('Employer not found');
//     }

//     if (!employer.isActive) {
//       throw new Error('Account is inactive');
//     }

//     const token = jwt.sign(
//       {
//         employerId: employer.id,
//         email: employer.email,
//         type: 'employer',
//       },
//       env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     const { password_hash, ...employerData } = employer;

//     return {
//       token,
//       employer: employerData,
//     };
//   }

//   // Login team member
//   async loginTeamMember(email: string, password: string) {
//     const user = await this.getUserByEmail(email);

//     if (!user) {
//       throw new Error('Invalid credentials');
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password_hash);

//     if (!isPasswordValid) {
//       throw new Error('Invalid credentials');
//     }

//     if (!user.isActive) {
//       throw new Error('Account is inactive');
//     }

//     const token = jwt.sign(
//       {
//         userId: user.id,
//         email: user.email,
//         username: user.username,
//         type: 'user',
//       },
//       env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     const { password_hash, ...userData } = user;

//     return {
//       token,
//       user: userData,
//     };
//   }

//   // Get full worker info (BuildSewa Team only)
//   async getFullWorkerInfo(profileId: string) {
//     const profile = await prisma.profile.findUnique({
//       where: { id: profileId },
//       include: {
//         addresses: true, // Get all addresses, not just current
//         bank_accounts: true, // Get all bank accounts
//         qualifications: true,
//         skills: {
//           include: {
//             skill_categories: true,
//           },
//         },
//         // COMMENTED OUT - Will implement project assignments later with different approach
//         // workerAssignments: {
//         //   include: {
//         //     projects: {
//         //       include: {
//         //         employers: true,
//         //       },
//         //     },
//         //   },
//         //   orderBy: {
//         //     deployment_date: 'desc',
//         //   },
//         // },
//         batch_enrollments: {
//           include: {
//             training_batches: true,
//           },
//         },
//         documents: true, // Get all documents
//         interactions: {
//           orderBy: {
//             interaction_date: 'desc',
//           },
//         },
//         profile_blacklist: {
//           where: {
//             isActive: true,
//           },
//         },
//         stage_transitions: {
//           orderBy: {
//             transitioned_at: 'desc',
//           },
//           take: 5,
//         },
//       },
//     });

//     if (!profile) {
//       return null;
//     }

//     // COMMENTED OUT - Will implement project assignments later
//     // const currentAssignment = profile.project_worker_assignments.find(
//     //   (pa: any) => pa.status === 'allocated' || pa.status === 'active'
//     // );

//     // Calculate age from date of birth
//     let age = null;
//     if (profile.date_of_birth) {
//       const today = new Date();
//       const birthDate = new Date(profile.date_of_birth);
//       age = today.getFullYear() - birthDate.getFullYear();
//       const monthDiff = today.getMonth() - birthDate.getMonth();
//       if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//         age--;
//       }
//     }

//     // Construct full URL for profile photo if it's a relative path
//     let profilePhotoUrl = profile.profile_photo_url;
//     if (
//       profilePhotoUrl &&
//       !profilePhotoUrl.startsWith('http://') &&
//       !profilePhotoUrl.startsWith('https://')
//     ) {
//       profilePhotoUrl = `${env.BASE_URL || 'http://localhost:3000'}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`;
//     }

//     return {
//       id: profile.id,
//       worker_code: profile.candidate_code,
//       qr_uuid: profile.id, // Using profile ID as QR UUID
//       personal_info: {
//         first_name: profile.first_name,
//         middle_name: profile.middle_name,
//         last_name: profile.last_name,
//         name: `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim(),
//         fathers_name: profile.fathers_name,
//         phone: profile.phone,
//         alt_phone: profile.alt_phone,
//         email: profile.email,
//         gender: profile.gender,
//         date_of_birth: profile.date_of_birth,
//         age: age,
//         profile_photo: profilePhotoUrl,
//       },
//       addresses: profile.addresses,
//       bank_accounts: profile.bank_accounts,
//       qualifications: profile.qualifications,
//       skills: profile.profile_skills.map((ps: any) => ({
//         id: ps.id,
//         skill_name: ps.skill_categories?.name,
//         skillCategoryId: ps.skillCategoryId,
//         years_of_experience: ps.years_of_experience,
//         is_primary: ps.is_primary,
//       })),
//       batch_enrollments: profile.batch_enrollments,
//       current_assignment: null, // Temporary - will be implemented later
//       // current_assignment:
//       //   currentAssignment && currentAssignment.projects
//       //     ? {
//       //         id: currentAssignment.id,
//       //         projectId: currentAssignment.projectId,
//       //         project_name: currentAssignment.projects.name,
//       //         project_code: currentAssignment.projects.code,
//       //         employer_name: currentAssignment.projects.employers?.company_name,
//       //         employer_code: currentAssignment.projects.employers?.employer_code,
//       //         status: currentAssignment.status,
//       //         deployment_date: currentAssignment.deployment_date,
//       //         expected_end_date: currentAssignment.expected_end_date,
//       //       }
//       //     : null,
//       all_assignments: [], // Temporary - will be implemented later
//       // all_assignments: profile.project_worker_assignments,
//       government_ids: {
//         esic_number: profile.esic_number,
//         uan_number: profile.uan_number,
//         pf_account_number: profile.pf_account_number,
//         pan_number: profile.pan_number,
//         health_insurance_policy_number: profile.health_insurance_policy_number,
//       },
//       documents: profile.documents,
//       interactions: profile.interactions,
//       is_blacklisted: profile.profile_blacklist && profile.profile_blacklist.length > 0,
//       blacklist_info: profile.profile_blacklist,
//       stage_history: profile.stage_transitions,
//       isActive: profile.isActive,
//       createdAt: profile.createdAt,
//       updatedAt: profile.updatedAt,
//     };
//   }

//   // Get worker info for employer (limited access)
//   async getWorkerInfoForEmployer(profileId: string, employerId: string) {
//     const profile = await prisma.profile.findUnique({
//       where: { id: profileId },
//       include: {
//         // COMMENTED OUT - Will implement project assignments later with different approach
//         // workerAssignments: {
//         //   where: {
//         //     status: 'shared', // Only show if status is 'shared' with employer
//         //   },
//         //   include: {
//         //     projects: {
//         //       include: {
//         //         employers: true,
//         //       },
//         //     },
//         //   },
//         //   orderBy: {
//         //     createdAt: 'desc',
//         //   },
//         // },
//         skills: {
//           include: {
//             skill_categories: true,
//           },
//         },
//       },
//     });

//     if (!profile) {
//       return null;
//     }

//     // COMMENTED OUT - Will implement project assignments later
//     // // Filter matched profiles to only show employer's projects with 'shared' status
//     // const employerSharedProfiles = profile.project_worker_assignments.filter(
//     //   (matched: any) => matched.projects?.employerId === employerId && matched.status === 'shared'
//     // );

//     // // Check if worker profile is shared with this employer
//     // if (!employerSharedProfiles || employerSharedProfiles.length === 0) {
//     //   return null;
//     // }

//     // const sharedProfile = employerSharedProfiles[0];

//     // Temporary - return null until feature is implemented (no sharing yet)
//     return null;

//     // COMMENTED OUT - unreachable code, will be implemented later
//     // // Calculate age from date of birth
//     // let age = null;
//     // if (profile.date_of_birth) {
//     //   const today = new Date();
//     //   const birthDate = new Date(profile.date_of_birth);
//     //   age = today.getFullYear() - birthDate.getFullYear();
//     //   const monthDiff = today.getMonth() - birthDate.getMonth();
//     //   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//     //     age--;
//     //   }
//     // }

//     // // Construct full URL for profile photo if it's a relative path
//     // let profilePhotoUrl = profile.profile_photo_url;
//     // if (profilePhotoUrl && !profilePhotoUrl.startsWith('http://') && !profilePhotoUrl.startsWith('https://')) {
//     //   profilePhotoUrl = `${env.BASE_URL || 'http://localhost:3000'}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`;
//     // }

//     // return {
//     //   worker_code: profile.candidate_code,
//     //   name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
//     //   profile_photo: profilePhotoUrl,
//     //   gender: profile.gender,
//     //   age: age,
//     //   current_project: sharedProfile.projects
//     //     ? {
//     //         project_name: sharedProfile.projects.name,
//     //         project_code: sharedProfile.projects.code,
//     //       }
//     //     : null,
//     //   skills: profile.profile_skills.map((ps: any) => ({
//     //     skill_name: ps.skill_categories?.name,
//     //     years_of_experience: ps.years_of_experience,
//     //     is_primary: ps.is_primary,
//     //   })),
//     //   // NO sensitive data: no phone, no documents, no bank details, no government IDs
//     //   // Only shows workers who have been explicitly SHARED with this employer
//     // };
//   }

//   // Get worker's own info (limited)
//   async getWorkerOwnInfo(requestedProfileId: string, authenticatedProfileId: string) {
//     // Verify the requested profile matches the authenticated profile
//     if (requestedProfileId !== authenticatedProfileId) {
//       return null;
//     }

//     const profile = await prisma.profile.findUnique({
//       where: { id: requestedProfileId },
//       // COMMENTED OUT - Will implement project assignments later with different approach
//       // include: {
//       //   workerAssignments: {
//       //     where: {
//       //       status: {
//       //         in: ['allocated', 'active'],
//       //       },
//       //     },
//       //     include: {
//       //       projects: {
//       //         include: {
//       //           employers: true,
//       //         },
//       //       },
//       //     },
//       //     orderBy: {
//       //       deployment_date: 'desc',
//       //     },
//       //   },
//       // },
//     });

//     if (!profile) {
//       return null;
//     }

//     // COMMENTED OUT - Will implement project assignments later
//     // const currentAssignment = profile.project_worker_assignments[0];

//     // Construct full URL for profile photo if it's a relative path
//     let profilePhotoUrl = profile.profile_photo_url;
//     if (
//       profilePhotoUrl &&
//       !profilePhotoUrl.startsWith('http://') &&
//       !profilePhotoUrl.startsWith('https://')
//     ) {
//       profilePhotoUrl = `${env.BASE_URL || 'http://localhost:3000'}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`;
//     }

//     return {
//       worker_code: profile.candidate_code,
//       name: `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim(),
//       profile_photo: profilePhotoUrl,
//       phone: profile.phone,
//       email: profile.email,
//       current_assignment: null, // Temporary - will be implemented later
//       // current_assignment:
//       //   currentAssignment && currentAssignment.projects
//       //     ? {
//       //         project_name: currentAssignment.projects.name,
//       //         project_code: currentAssignment.projects.code,
//       //         employer_name: currentAssignment.projects.employers?.company_name,
//       //         status: currentAssignment.status,
//       //         deployment_date: currentAssignment.deployment_date,
//       //       }
//       //     : null,
//     };
//   }

//   // Get worker info by profile ID
//   async getWorkerInfoByProfileId(profileId: string) {
//     const profile = await prisma.profile.findUnique({
//       where: { id: profileId },
//       // COMMENTED OUT - Will implement project assignments later with different approach
//       // include: {
//       //   workerAssignments: {
//       //     where: {
//       //       status: {
//       //         in: ['allocated', 'active'],
//       //       },
//       //     },
//       //     include: {
//       //       projects: {
//       //         include: {
//       //           employers: true,
//       //         },
//       //       },
//       //     },
//       //     orderBy: {
//       //       deployment_date: 'desc',
//       //     },
//       //   },
//       // },
//     });

//     if (!profile) {
//       return null;
//     }

//     // COMMENTED OUT - Will implement project assignments later
//     // const currentAssignment = profile.project_worker_assignments[0];

//     // Construct full URL for profile photo if it's a relative path
//     let profilePhotoUrl = profile.profile_photo_url;
//     if (
//       profilePhotoUrl &&
//       !profilePhotoUrl.startsWith('http://') &&
//       !profilePhotoUrl.startsWith('https://')
//     ) {
//       profilePhotoUrl = `${env.BASE_URL || 'http://localhost:3000'}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`;
//     }

//     return {
//       worker_code: profile.candidate_code,
//       name: `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim(),
//       profile_photo: profilePhotoUrl,
//       phone: profile.phone,
//       email: profile.email,
//       current_assignment: null, // Temporary - will be implemented later
//       // current_assignment:
//       //   currentAssignment && currentAssignment.projects
//       //     ? {
//       //         project_name: currentAssignment.projects.name,
//       //         project_code: currentAssignment.projects.code,
//       //         employer_name: currentAssignment.projects.employers?.company_name,
//       //         status: currentAssignment.status,
//       //         deployment_date: currentAssignment.deployment_date,
//       //       }
//       //     : null,
//     };
//   }
// }

// export const workerDetailsService = new WorkerDetailsService();
