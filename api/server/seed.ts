import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  jobs,
  applications,
  users,
  categories,
  employers,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@pilijobs.com",
        passwordHash: hashedPassword,
        role: "admin",
        firstName: "Admin",
        lastName: "User",
        phone: "+63912345678",
        address: "Pili Centro",
        isActive: true,
        isVerified: true,
      })
      .returning();

    // Employer users
    const [employer1] = await db
      .insert(users)
      .values({
        email: "employer1@company.com",
        passwordHash: hashedPassword,
        role: "employer",
        firstName: "John",
        lastName: "Manager",
        phone: "+639123456790",
        address: "Bagumbayan, Pili",
        isActive: true,
        isVerified: true,
        verificationStatus: "approved",
      })
      .returning();

    const [employer2] = await db
      .insert(users)
      .values({
        email: "employer2@business.com",
        passwordHash: hashedPassword,
        role: "employer",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+639123456791",
        address: "San Jose, Pili",
        isActive: true,
        isVerified: true,
        verificationStatus: "approved",
      })
      .returning();

    const [employer3] = await db
      .insert(users)
      .values({
        email: "employer3@restaurant.com",
        passwordHash: hashedPassword,
        role: "employer",
        firstName: "Carlos",
        lastName: "Rodriguez",
        phone: "+639123456792",
        address: "Santiago, Pili",
        isActive: true,
        isVerified: true,
        verificationStatus: "approved",
      })
      .returning();

    // Job seekers with COMPLETE profiles for testing matching
    const [jobseeker1] = await db
      .insert(users)
      .values({
        email: "maria.tech@email.com",
        passwordHash: hashedPassword,
        role: "jobseeker",
        firstName: "Maria",
        lastName: "Cruz",
        phone: "+639123456793",
        address: "Santa Cruz Norte, Pili",
        skills: "Web Development, JavaScript, React, HTML, CSS, Customer Service",
        desiredRoles: "Web Developer, Software Developer, IT Support",
        experienceLevel: "Entry",
        preferredLocation: "Any Location",
        isActive: true,
        isVerified: true,
      })
      .returning();

    const [jobseeker2] = await db
      .insert(users)
      .values({
        email: "pedro.hospitality@email.com",
        passwordHash: hashedPassword,
        role: "jobseeker",
        firstName: "Pedro",
        lastName: "Santos",
        phone: "+639123456794",
        address: "Santiago, Pili",
        skills: "Customer Service, Food Service, Communication, Teamwork, Cash Handling",
        desiredRoles: "Restaurant Server, Cashier, Customer Service Representative",
        experienceLevel: "Mid",
        preferredLocation: "Santiago",
        isActive: true,
        isVerified: true,
      })
      .returning();

    const [jobseeker3] = await db
      .insert(users)
      .values({
        email: "anna.admin@email.com",
        passwordHash: hashedPassword,
        role: "jobseeker",
        firstName: "Anna",
        lastName: "Reyes",
        phone: "+639123456795",
        address: "Bagumbayan, Pili",
        skills: "Microsoft Office, Data Entry, Filing, Communication, Organization, Customer Service",
        desiredRoles: "Administrative Assistant, Secretary, Office Clerk",
        experienceLevel: "Mid",
        preferredLocation: "Bagumbayan",
        isActive: true,
        isVerified: true,
      })
      .returning();

    const [jobseeker4] = await db
      .insert(users)
      .values({
        email: "jose.driver@email.com",
        passwordHash: hashedPassword,
        role: "jobseeker",
        firstName: "Jose",
        lastName: "Mendoza",
        phone: "+639123456796",
        address: "Palestina, Pili",
        skills: "Driving, Navigation, Customer Service, Time Management, Vehicle Maintenance",
        desiredRoles: "Delivery Driver, Truck Driver, Personal Driver",
        experienceLevel: "Senior",
        preferredLocation: "Any Location",
        isActive: true,
        isVerified: true,
      })
      .returning();

    const [jobseeker5] = await db
      .insert(users)
      .values({
        email: "lisa.teacher@email.com",
        passwordHash: hashedPassword,
        role: "jobseeker",
        firstName: "Lisa",
        lastName: "Garcia",
        phone: "+639123456797",
        address: "Santo Domingo, Pili",
        skills: "Teaching, Mathematics, English, Communication, Classroom Management, Tutoring",
        desiredRoles: "Teacher, Tutor, Education Coordinator",
        experienceLevel: "Mid",
        preferredLocation: "Santo Domingo",
        isActive: true,
        isVerified: true,
      })
      .returning();

    const [jobseeker6] = await db
      .insert(users)
      .values({
        email: "marco.sales@email.com",
        passwordHash: hashedPassword,
        role: "jobseeker",
        firstName: "Marco",
        lastName: "Villanueva",
        phone: "+639123456798",
        address: "San Jose, Pili",
        skills: "Sales, Retail, Customer Service, Product Knowledge, Inventory Management, Communication",
        desiredRoles: "Sales Associate, Retail Clerk, Store Manager",
        experienceLevel: "Entry",
        preferredLocation: "San Jose",
        isActive: true,
        isVerified: true,
      })
      .returning();

    // Create diverse jobs across categories
    const jobsData = [
      // Technology jobs
      {
        title: "Junior Web Developer",
        description: "We're looking for a motivated Junior Web Developer to join our team. You'll work on building responsive websites and web applications using modern technologies.",
        company: "Pili Tech Solutions",
        location: "Bagumbayan",
        salary: "₱20,000 - ₱30,000",
        type: "Full-time",
        category: "Technology",
        employerId: employer1.id,
        requirements: "Web Development, JavaScript, HTML, CSS, React or similar framework",
        requiredSkills: "Web Development, JavaScript, React, HTML, CSS",
        benefits: "Health insurance, 13th month pay, Professional development",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: true,
      },
      {
        title: "IT Support Specialist",
        description: "Provide technical support to our clients, troubleshoot hardware and software issues, and maintain network infrastructure.",
        company: "Pili Computer Services",
        location: "San Jose",
        salary: "₱18,000 - ₱25,000",
        type: "Full-time",
        category: "Technology",
        employerId: employer2.id,
        requirements: "IT Support, Computer Hardware, Windows, Networking, Problem Solving",
        requiredSkills: "IT Support, Computer Hardware, Networking, Windows",
        benefits: "Health coverage, Training programs, Performance bonus",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: false,
      },

      // Food Service jobs
      {
        title: "Restaurant Server",
        description: "Join our team as a restaurant server. Take orders, serve customers, and ensure excellent dining experience for our guests.",
        company: "Pili Family Restaurant",
        location: "Santiago",
        salary: "₱15,000 - ₱20,000",
        type: "Full-time",
        category: "Food Service",
        employerId: employer3.id,
        requirements: "Customer Service, Food Service, Communication, Teamwork",
        requiredSkills: "Customer Service, Food Service, Communication",
        benefits: "Meal allowance, Service charge, Overtime pay, Tips",
        email: "employer3@restaurant.com",
        phone: "+639123456792",
        isActive: true,
        isFeatured: true,
      },
      {
        title: "Barista",
        description: "Prepare and serve coffee beverages, maintain cleanliness, and provide excellent customer service in our cafe.",
        company: "Pili Coffee House",
        location: "Bagumbayan",
        salary: "₱14,000 - ₱18,000",
        type: "Full-time",
        category: "Food Service",
        employerId: employer3.id,
        requirements: "Customer Service, Food Service, Coffee Preparation, Cash Handling",
        requiredSkills: "Customer Service, Food Service, Cash Handling",
        benefits: "Free meals, Tips, Flexible schedule",
        email: "employer3@restaurant.com",
        phone: "+639123456792",
        isActive: true,
        isFeatured: false,
      },
      {
        title: "Kitchen Staff",
        description: "Assist in food preparation, maintain kitchen cleanliness, and follow food safety protocols.",
        company: "Pili Grill House",
        location: "Santiago",
        salary: "₱13,000 - ₱17,000",
        type: "Full-time",
        category: "Food Service",
        employerId: employer3.id,
        requirements: "Food Preparation, Kitchen Operations, Hygiene Standards, Teamwork",
        requiredSkills: "Food Preparation, Kitchen Operations, Teamwork",
        benefits: "Meal allowance, 13th month pay",
        email: "employer3@restaurant.com",
        phone: "+639123456792",
        isActive: true,
        isFeatured: false,
      },

      // Administrative jobs
      {
        title: "Administrative Assistant",
        description: "Support office operations with administrative tasks, document preparation, data entry, and customer communication.",
        company: "Pili Municipal Office",
        location: "Bagumbayan",
        salary: "₱18,000 - ₱25,000",
        type: "Full-time",
        category: "Administrative",
        employerId: employer1.id,
        requirements: "Microsoft Office, Data Entry, Communication, Organization, Filing",
        requiredSkills: "Microsoft Office, Data Entry, Organization, Communication",
        benefits: "Government benefits, Paid leaves, Training opportunities",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: true,
      },
      {
        title: "Office Clerk",
        description: "Handle filing, data entry, phone calls, and general office support tasks.",
        company: "Pili Business Center",
        location: "San Jose",
        salary: "₱15,000 - ₱20,000",
        type: "Full-time",
        category: "Administrative",
        employerId: employer2.id,
        requirements: "Microsoft Office, Filing, Data Entry, Phone Etiquette, Organization",
        requiredSkills: "Microsoft Office, Data Entry, Filing, Organization",
        benefits: "Health insurance, 13th month pay",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: false,
      },

      // Transportation jobs
      {
        title: "Delivery Driver",
        description: "Deliver products to customers in Pili and surrounding areas. Must have valid driver's license and motorcycle.",
        company: "Pili Express Delivery",
        location: "Palestina",
        salary: "₱16,000 - ₱22,000",
        type: "Full-time",
        category: "Transportation",
        employerId: employer2.id,
        requirements: "Driving, Navigation, Customer Service, Time Management, Valid License",
        requiredSkills: "Driving, Navigation, Time Management, Customer Service",
        benefits: "Fuel allowance, Maintenance support, Insurance coverage",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: true,
      },
      {
        title: "Tricycle Driver",
        description: "Transport passengers within Pili. Must have professional driver's license and own tricycle.",
        company: "Pili Transport Cooperative",
        location: "Santiago",
        salary: "₱500 - ₱800 per day",
        type: "Contract",
        category: "Transportation",
        employerId: employer1.id,
        requirements: "Driving, Navigation, Customer Service, Valid Professional License",
        requiredSkills: "Driving, Customer Service, Navigation",
        benefits: "Flexible schedule, Fuel subsidy",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: false,
      },

      // Education jobs
      {
        title: "Math Tutor",
        description: "Provide one-on-one or group tutoring for high school students in mathematics.",
        company: "Pili Learning Center",
        location: "Santo Domingo",
        salary: "₱400 - ₱600 per hour",
        type: "Part-time",
        category: "Education",
        employerId: employer1.id,
        requirements: "Mathematics, Teaching, Communication, Patience, Tutoring",
        requiredSkills: "Mathematics, Teaching, Tutoring, Communication",
        benefits: "Flexible schedule, Professional development, Performance bonus",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: false,
      },
      {
        title: "English Teacher",
        description: "Teach English to elementary and high school students. Full curriculum development and classroom management.",
        company: "Pili Private School",
        location: "Bagumbayan",
        salary: "₱20,000 - ₱28,000",
        type: "Full-time",
        category: "Education",
        employerId: employer1.id,
        requirements: "English, Teaching, Classroom Management, Communication, Lesson Planning",
        requiredSkills: "English, Teaching, Communication, Classroom Management",
        benefits: "Health insurance, Summer vacation pay, Professional development",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: true,
      },

      // Retail jobs
      {
        title: "Sales Associate",
        description: "Assist customers, manage inventory, handle transactions, and maintain store appearance.",
        company: "Pili Shopping Center",
        location: "San Jose",
        salary: "₱15,000 - ₱20,000",
        type: "Full-time",
        category: "Retail",
        employerId: employer2.id,
        requirements: "Sales, Customer Service, Retail, Product Knowledge, Communication",
        requiredSkills: "Sales, Customer Service, Retail, Communication",
        benefits: "Health insurance, Employee discount, Performance bonus",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: true,
      },
      {
        title: "Cashier",
        description: "Process customer transactions, handle cash and credit payments, maintain accurate records.",
        company: "Pili Supermarket",
        location: "Bagumbayan",
        salary: "₱14,000 - ₱18,000",
        type: "Full-time",
        category: "Retail",
        employerId: employer2.id,
        requirements: "Cash Handling, Customer Service, Attention to Detail, Basic Math",
        requiredSkills: "Cash Handling, Customer Service",
        benefits: "13th month pay, Employee discount",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: false,
      },
      {
        title: "Inventory Clerk",
        description: "Manage stock levels, receive shipments, organize warehouse, track inventory.",
        company: "Pili Warehouse",
        location: "Palestina",
        salary: "₱16,000 - ₱21,000",
        type: "Full-time",
        category: "Retail",
        employerId: employer1.id,
        requirements: "Inventory Management, Organization, Data Entry, Physical Work",
        requiredSkills: "Inventory Management, Organization, Data Entry",
        benefits: "Health insurance, 13th month pay",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: false,
      },

      // Healthcare jobs
      {
        title: "Nursing Assistant",
        description: "Assist nurses with patient care, monitoring, and daily activities in our healthcare facility.",
        company: "Pili Health Clinic",
        location: "Bagumbayan",
        salary: "₱18,000 - ₱24,000",
        type: "Full-time",
        category: "Healthcare",
        employerId: employer1.id,
        requirements: "Patient Care, Healthcare, Communication, Compassion, Basic First Aid",
        requiredSkills: "Patient Care, Healthcare, Communication",
        benefits: "Health insurance, Hazard pay, Professional development",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: false,
      },

      // Construction jobs
      {
        title: "Construction Worker",
        description: "General construction labor including carpentry, masonry, and site cleanup.",
        company: "Pili Builders Inc",
        location: "Santiago",
        salary: "₱400 - ₱600 per day",
        type: "Contract",
        category: "Construction",
        employerId: employer2.id,
        requirements: "Construction, Physical Labor, Teamwork, Safety Awareness",
        requiredSkills: "Construction, Physical Labor, Teamwork",
        benefits: "Daily pay, Meal allowance, Safety equipment provided",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: false,
      },

      // Freelance jobs
      {
        title: "Graphic Designer",
        description: "Create marketing materials, logos, and social media graphics for various clients on a project basis.",
        company: "Pili Creative Studio",
        location: "Any Location",
        salary: "₱2,000 - ₱5,000 per project",
        type: "Freelance",
        category: "Creative",
        employerId: employer1.id,
        requirements: "Graphic Design, Adobe Photoshop, Illustrator, Creativity, Communication",
        requiredSkills: "Graphic Design, Adobe Photoshop, Creativity",
        benefits: "Flexible schedule, Work from home, Portfolio building",
        email: "employer1@company.com",
        phone: "+639123456790",
        isActive: true,
        isFeatured: false,
      },

      // Customer service
      {
        title: "Customer Service Representative",
        description: "Handle customer inquiries, complaints, and provide product information via phone and email.",
        company: "Pili Call Center",
        location: "San Jose",
        salary: "₱17,000 - ₱23,000",
        type: "Full-time",
        category: "Customer Service",
        employerId: employer2.id,
        requirements: "Customer Service, Communication, Problem Solving, Computer Skills",
        requiredSkills: "Customer Service, Communication, Problem Solving",
        benefits: "Health insurance, Night differential, Performance bonus",
        email: "employer2@business.com",
        phone: "+639123456791",
        isActive: true,
        isFeatured: true,
      },
    ];

    const createdJobs = [];
    for (const jobData of jobsData) {
      const [job] = await db.insert(jobs).values(jobData).returning();
      createdJobs.push(job);
    }

    console.log("Database seeded successfully!");
    console.log("\n=== TEST LOGIN CREDENTIALS ===");
    console.log("\nAdmin Account:");
    console.log("  Email: admin@pilijobs.com");
    console.log("  Password: password123");
    console.log("\nEmployer Accounts:");
    console.log("  Email: employer1@company.com / Password: password123");
    console.log("  Email: employer2@business.com / Password: password123");
    console.log("  Email: employer3@restaurant.com / Password: password123");
    console.log("\nJob Seeker Accounts (WITH COMPLETE PROFILES for testing matching):");
    console.log("  1. Maria Cruz (Tech) - maria.tech@email.com / password123");
    console.log("     Skills: Web Development, JavaScript, React");
    console.log("     Best matches: Web Developer, IT Support jobs");
    console.log("\n  2. Pedro Santos (Hospitality) - pedro.hospitality@email.com / password123");
    console.log("     Skills: Customer Service, Food Service");
    console.log("     Best matches: Restaurant Server, Barista, Cashier jobs");
    console.log("\n  3. Anna Reyes (Admin) - anna.admin@email.com / password123");
    console.log("     Skills: Microsoft Office, Data Entry, Organization");
    console.log("     Best matches: Administrative Assistant, Office Clerk jobs");
    console.log("\n  4. Jose Mendoza (Driver) - jose.driver@email.com / password123");
    console.log("     Skills: Driving, Navigation, Time Management");
    console.log("     Best matches: Delivery Driver, Tricycle Driver jobs");
    console.log("\n  5. Lisa Garcia (Teacher) - lisa.teacher@email.com / password123");
    console.log("     Skills: Teaching, Mathematics, English");
    console.log("     Best matches: Teacher, Tutor jobs");
    console.log("\n  6. Marco Villanueva (Sales) - marco.sales@email.com / password123");
    console.log("     Skills: Sales, Retail, Customer Service");
    console.log("     Best matches: Sales Associate, Retail jobs");
    console.log("\nTotal Jobs Created: " + createdJobs.length);
    console.log("================================\n");

    return { success: true, message: "Database seeded successfully!" };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw new Error("Failed to seed database");
  }
}
