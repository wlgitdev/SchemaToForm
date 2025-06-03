import { User } from "@/types/User";

export class UsersApi {
  constructor() {}

  /**
   * getAll
   */
  public getAll(): User[] {
    return [
      {
        id: 1,
        name: "John Doe",
        age: 30,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        tags: ["frontend", "react", "typescript"],
        department: 1,
        skills: [1, 2],
      },
      {
        id: 2,
        name: "Jane Smith",
        age: 28,
        isActive: false,
        createdAt: new Date(),
        department: 2,
        tags: ["backend", "node.js", "databases"],
        skills: [3, 4],
      },
      {
        id: 3,
        name: "Alice Johnson",
        age: 35,
        isActive: true,
        createdAt: new Date(),
        department: 1,
        tags: ["backend", "node.js", "databases"],
        skills: [5, 6],
      },
      {
        id: 4,
        name: "Bob Brown",
        age: 40,
        isActive: false,
        createdAt: new Date(),
        department: 3,
        tags: ["recruitment", "policy", "training"],
      },
      {
        id: 5,
        name: "Charlie Davis",
        age: 25,
        isActive: true,
        createdAt: new Date(),
        department: 2,
        tags: ["social media", "ads", "copywriting"],
      },
      {
        id: 6,
        name: "Diana Prince",
        age: 32,
        isActive: true,
        createdAt: new Date(),
        department: 4,
        tags: ["accounting", "budgeting", "taxation"],
      },
      {
        id: 7,
        name: "Ethan Hunt",
        age: 29,
        isActive: false,
        createdAt: new Date(),
        department: 5,
        tags: ["logistics", "supply chain", "efficiency"],
      },
      {
        id: 8,
        name: "Fiona Gallagher",
        age: 38,
        isActive: true,
        createdAt: new Date(),
        department: 1,
        tags: ["fullstack", "java", "cloud computing"],
      },
      {
        id: 9,
        name: "George Miller",
        age: 45,
        isActive: false,
        createdAt: new Date(),
        department: 3,
        tags: ["employee relations", "compensation", "benefits"],
      },
      {
        id: 10,
        name: "Hannah Wilson",
        age: 27,
        isActive: true,
        createdAt: new Date(),
        department: 2,
        tags: ["branding", "campaigns", "market research"],
      },
      {
        id: 11,
        name: "Ian Curtis",
        age: 31,
        isActive: false,
        createdAt: new Date(),
        department: 4,
        tags: ["auditing", "financial analysis", "compliance"],
      },
      {
        id: 14,
        name: "WL Record",
        age: 31,
        isActive: false,
        createdAt: new Date(),
        department: 4,
        tags: ["auditing", "financial analysis", "compliance"],
      },
      {
        id: 12,
        name: "Jack Sparrow",
        age: 36,
        isActive: true,
        createdAt: new Date(),
        department: 5,
        tags: ["risk management", "workflow optimization", "logistics"],
      },
    ];
  }
}
