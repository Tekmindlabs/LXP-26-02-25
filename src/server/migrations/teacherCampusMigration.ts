import { PrismaClient } from "@prisma/client";

/**
 * Migrates existing teacher-campus relationships from class assignments to direct relationships
 * This script should be run after the TeacherCampus table has been created
 */
export async function migrateTeacherCampusRelationships(prisma: PrismaClient) {
  console.log("Starting teacher-campus relationship migration...");
  
  // Get all teachers with class assignments
  const teachers = await prisma.teacherProfile.findMany({
    include: {
      classes: {
        include: {
          class: true
        }
      }
    }
  });
  
  console.log(`Found ${teachers.length} teachers to process`);
  
  // Track statistics
  let created = 0;
  let skipped = 0;
  
  // Create TeacherCampus entries based on existing class assignments
  for (const teacher of teachers) {
    // Get unique campuses from teacher's classes
    const campusIds = new Set<string>();
    for (const classAssignment of teacher.classes) {
      if (classAssignment.class.campusId) {
        campusIds.add(classAssignment.class.campusId);
      }
    }
    
    console.log(`Teacher ${teacher.id} has classes in ${campusIds.size} campuses`);
    
    // Create TeacherCampus entries
    for (const campusId of Array.from(campusIds)) {
      // Check if relationship already exists
      const existing = await prisma.$queryRaw`
        SELECT id FROM "teacher_campuses" 
        WHERE "teacherId" = ${teacher.id} AND "campusId" = ${campusId}
      `;
      
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`Relationship already exists for teacher ${teacher.id} and campus ${campusId}`);
        skipped++;
        continue;
      }
      
      // Create new relationship
      await prisma.$executeRaw`
        INSERT INTO "teacher_campuses" ("id", "teacherId", "campusId", "isPrimary", "status", "joinedAt", "createdAt", "updatedAt")
        VALUES (
          ${`tc_${teacher.id}_${campusId}`}, 
          ${teacher.id}, 
          ${campusId}, 
          false, 
          'ACTIVE', 
          ${new Date()}, 
          ${new Date()}, 
          ${new Date()}
        )
      `;
      
      created++;
    }
  }
  
  console.log(`Migration complete. Created ${created} new teacher-campus relationships. Skipped ${skipped} existing relationships.`);
}

/**
 * Validates the teacher-campus relationships to ensure all teachers have at least one campus
 */
export async function validateTeacherCampusRelationships(prisma: PrismaClient) {
  console.log("Validating teacher-campus relationships...");
  
  // Get all teachers
  const teachers = await prisma.teacherProfile.findMany();
  
  let teachersWithoutCampus = 0;
  
  // Check each teacher has at least one campus
  for (const teacher of teachers) {
    const campusCount = await prisma.$queryRaw<number>`
      SELECT COUNT(*) FROM "teacher_campuses" WHERE "teacherId" = ${teacher.id}
    `;
    
    if (campusCount === 0) {
      teachersWithoutCampus++;
      console.log(`Teacher ${teacher.id} has no campus assignments`);
    }
  }
  
  console.log(`Validation complete. Found ${teachersWithoutCampus} teachers without campus assignments.`);
  
  return teachersWithoutCampus === 0;
}

/**
 * Sets the primary campus for teachers who don't have one
 */
export async function setPrimaryTeacherCampuses(prisma: PrismaClient) {
  console.log("Setting primary campuses for teachers...");
  
  // Get all teachers
  const teachers = await prisma.teacherProfile.findMany();
  
  let updated = 0;
  
  // For each teacher, check if they have a primary campus
  for (const teacher of teachers) {
    const campuses = await prisma.$queryRaw<Array<{ id: string, isPrimary: boolean }>>`
      SELECT id, "isPrimary" FROM "teacher_campuses" WHERE "teacherId" = ${teacher.id}
    `;
    
    if (campuses.length === 0) {
      continue; // Skip teachers with no campuses
    }
    
    // Check if teacher already has a primary campus
    const hasPrimary = campuses.some((c) => c.isPrimary);
    
    if (!hasPrimary && campuses.length > 0) {
      // Set the first campus as primary
      await prisma.$executeRaw`
        UPDATE "teacher_campuses" SET "isPrimary" = true WHERE id = ${campuses[0].id}
      `;
      
      updated++;
    }
  }
  
  console.log(`Primary campus setting complete. Updated ${updated} teachers.`);
}

/**
 * Run all migration steps in sequence
 */
export async function runTeacherCampusMigration(prisma: PrismaClient) {
  await migrateTeacherCampusRelationships(prisma);
  await validateTeacherCampusRelationships(prisma);
  await setPrimaryTeacherCampuses(prisma);
  
  console.log("Teacher-campus migration completed successfully.");
} 