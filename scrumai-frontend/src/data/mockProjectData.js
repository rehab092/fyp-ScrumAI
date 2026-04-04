// Mock data for Product Owner portal
export const mockProjects = [
  {
    projectId: "P1",
    projectName: "E-Commerce Platform",
    projectDescription: "Build a scalable e-commerce platform with payment integration",
    projectGoal: "Increase online sales by 150%",
    startDate: "2026-04-01",
    endDate: "2026-08-01",
    priority: "High",
    status: "Active",
    userStories: [
      {
        storyId: "US1",
        title: "User Login System",
        description: "As a user I want to log in securely to access my account",
        acceptanceCriteria: [
          "User can enter email and password",
          "Email validation appears immediately",
          "Login success redirects to dashboard",
          "Invalid credentials show error message",
          "Password reset link is available"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 100,
        createdDate: "2026-04-04",
        tasks: [
          { id: "T1", name: "Design login UI mockup", allocatedPoints: 40 },
          { id: "T2", name: "Connect authentication API", allocatedPoints: 30 },
          { id: "T3", name: "Add client-side validation", allocatedPoints: 30 }
        ]
      },
      {
        storyId: "US2",
        title: "Product Catalog",
        description: "As a shopper I want to browse all available products with filters",
        acceptanceCriteria: [
          "Display all products in grid layout",
          "Filter by category, price, rating",
          "Search functionality works",
          "Pagination or infinite scroll implemented",
          "Product images load quickly"
        ],
        priority: "High",
        status: "In Progress",
        storyPoints: 120,
        createdDate: "2026-04-03",
        tasks: [
          { id: "T4", name: "Create product grid component", allocatedPoints: 50 },
          { id: "T5", name: "Build filter panel UI", allocatedPoints: 40 },
          { id: "T6", name: "Implement search API integration", allocatedPoints: 30 }
        ]
      },
      {
        storyId: "US3",
        title: "Shopping Cart",
        description: "As a customer I want to add items to cart and proceed to checkout",
        acceptanceCriteria: [
          "Add/remove items from cart",
          "Update item quantities",
          "View cart total in real-time",
          "Save cart for later",
          "Clear cart option available"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 80,
        createdDate: "2026-04-02",
        tasks: [
          { id: "T7", name: "Design cart UI", allocatedPoints: 30 },
          { id: "T8", name: "Implement add/remove logic", allocatedPoints: 25 },
          { id: "T9", name: "Add cart persistence", allocatedPoints: 25 }
        ]
      },
      {
        storyId: "US4",
        title: "Payment Gateway",
        description: "As a customer I want to pay for my order securely",
        acceptanceCriteria: [
          "Support multiple payment methods",
          "Implement SSL encryption",
          "Process payments securely",
          "Handle failed payments gracefully",
          "Send payment confirmation email"
        ],
        priority: "High",
        status: "Completed",
        storyPoints: 150,
        createdDate: "2026-04-01",
        tasks: [
          { id: "T10", name: "Integrate Stripe API", allocatedPoints: 70 },
          { id: "T11", name: "Build payment form", allocatedPoints: 50 },
          { id: "T12", name: "Add error handling", allocatedPoints: 30 }
        ]
      }
    ]
  },
  {
    projectId: "P2",
    projectName: "Mobile App",
    projectDescription: "Native mobile application for iOS and Android",
    projectGoal: "Expand market reach to mobile users",
    startDate: "2026-05-01",
    endDate: "2026-09-01",
    priority: "Medium",
    status: "Planning",
    userStories: [
      {
        storyId: "US5",
        title: "App Setup & Configuration",
        description: "As a developer I want the app configured with all necessary dependencies",
        acceptanceCriteria: [
          "React Native project initialized",
          "Navigation structure set up",
          "API client configured",
          "Authentication integrated",
          "Build pipeline automated"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 60,
        createdDate: "2026-04-04",
        tasks: [
          { id: "T13", name: "Initialize React Native project", allocatedPoints: 20 },
          { id: "T14", name: "Setup navigation", allocatedPoints: 20 },
          { id: "T15", name: "Configure API client", allocatedPoints: 20 }
        ]
      },
      {
        storyId: "US6",
        title: "Push Notifications",
        description: "As a user I want to receive push notifications for important updates",
        acceptanceCriteria: [
          "User can opt-in/out of notifications",
          "Notifications show in notification center",
          "Tapping notification opens relevant screen",
          "Notification permissions requested on app launch",
          "Notifications logged for analytics"
        ],
        priority: "Medium",
        status: "Ready",
        storyPoints: 90,
        createdDate: "2026-04-04",
        tasks: [
          { id: "T16", name: "Setup Firebase Cloud Messaging", allocatedPoints: 30 },
          { id: "T17", name: "Create notification UI", allocatedPoints: 30 },
          { id: "T18", name: "Implement notification routing", allocatedPoints: 30 }
        ]
      }
    ]
  }
];

export const getInitialProjectsState = () => JSON.parse(JSON.stringify(mockProjects));
