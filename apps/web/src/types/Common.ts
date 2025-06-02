

export interface ListActions {
    actions?: Array<{
      label: string;
      variant?: "primary" | "secondary" | "text" | "link";
      icon?: string;
      onClick: () => void;
    }>;
  }