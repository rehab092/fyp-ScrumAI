export const mockProjectData = [
  {
    projectId: "P1",
    projectName: "E-Commerce Platform Redesign",
    projectDescription: "Complete redesign of the e-commerce platform with modern UI/UX",
    projectGoal: "Improve user experience and increase conversion rate by 25%",
    status: "Active",
    priority: "High",
    startDate: "2026-01-15",
    endDate: "2026-06-30",
    userStories: [
      {
        storyId: "US1",
        title: "User Authentication System",
        description: "Implement secure login and registration system with OAuth support",
        acceptanceCriteria: [
          "Users can register with email and password",
          "Users can log in with existing credentials",
          "OAuth integration with Google and GitHub",
          "Password reset functionality"
        ],
        priority: "High",
        status: "Completed",
        storyPoints: 13,
        createdDate: "2026-01-20"
      },
      {
        storyId: "US2",
        title: "Product Catalog Display",
        description: "Display products in a responsive grid with filtering and sorting",
        acceptanceCriteria: [
          "Display products in a responsive grid layout",
          "Filter by category, price, and rating",
          "Sort by popularity, price, and newest",
          "Product images and descriptions visible"
        ],
        priority: "High",
        status: "In Progress",
        storyPoints: 8,
        createdDate: "2026-02-01"
      },
      {
        storyId: "US3",
        title: "Shopping Cart Functionality",
        description: "Implement add to cart, update quantity, and remove item features",
        acceptanceCriteria: [
          "Add products to cart",
          "Update product quantities",
          "Remove items from cart",
          "Calculate total price and taxes"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 8,
        createdDate: "2026-02-05"
      },
      {
        storyId: "US4",
        title: "Payment Integration",
        description: "Integrate Stripe and PayPal for secure payment processing",
        acceptanceCriteria: [
          "Stripe payment integration",
          "PayPal payment integration",
          "Order confirmation email",
          "Payment receipt generation"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 13,
        createdDate: "2026-02-10"
      },
      {
        storyId: "US5",
        title: "User Profile Management",
        description: "Allow users to manage their profile, addresses, and preferences",
        acceptanceCriteria: [
          "Edit profile information",
          "Manage multiple addresses",
          "View order history",
          "Set notification preferences"
        ],
        priority: "Medium",
        status: "Ready",
        storyPoints: 5,
        createdDate: "2026-02-15"
      },
      {
        storyId: "US6",
        title: "Product Reviews and Ratings",
        description: "Users can review and rate products they have purchased",
        acceptanceCriteria: [
          "Submit product reviews",
          "Rate products 1-5 stars",
          "View average ratings",
          "Flag inappropriate reviews"
        ],
        priority: "Medium",
        status: "Ready",
        storyPoints: 5,
        createdDate: "2026-02-20"
      }
    ]
  },
  {
    projectId: "P2",
    projectName: "Mobile App - iOS Development",
    projectDescription: "Native iOS application for our e-commerce platform",
    projectGoal: "Launch iOS app with 1M downloads in first year",
    status: "Planning",
    priority: "Medium",
    startDate: "2026-03-01",
    endDate: "2026-09-30",
    userStories: [
      {
        storyId: "US7",
        title: "App Navigation Structure",
        description: "Implement bottom tab navigation for main sections",
        acceptanceCriteria: [
          "Home tab with featured products",
          "Search tab with product discovery",
          "Cart tab with shopping cart",
          "Account tab with user profile"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 8,
        createdDate: "2026-03-05"
      },
      {
        storyId: "US8",
        title: "Product Search and Filter",
        description: "Advanced search with filters for mobile",
        acceptanceCriteria: [
          "Full-text product search",
          "Filter by category and price",
          "Sort search results",
          "Save favorite searches"
        ],
        priority: "High",
        status: "Ready",
        storyPoints: 8,
        createdDate: "2026-03-10"
      },
      {
        storyId: "US9",
        title: "Push Notifications",
        description: "Send push notifications for orders and promotions",
        acceptanceCriteria: [
          "Order status notifications",
          "Promotional alerts",
          "User preference management",
          "Notification history"
        ],
        priority: "Medium",
        status: "Ready",
        storyPoints: 5,
        createdDate: "2026-03-15"
      },
      {
        storyId: "US10",
        title: "Offline Mode Support",
        description: "Allow browsing cached products offline",
        acceptanceCriteria: [
          "Cache product listings",
          "View cached products offline",
          "Sync when connection restored",
          "Clear cache option"
        ],
        priority: "Low",
        status: "Ready",
        storyPoints: 5,
        createdDate: "2026-03-20"
      }
    ]
  }
];
