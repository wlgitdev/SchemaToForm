import { useFormTheme } from "..";
import React from "react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const theme = useFormTheme();

  return (
    <div className={theme.section.collapsible.container}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${theme.section.collapsible.button} ${
          isOpen ? "border-gray-200" : "border-transparent"
        }`}
      >
        <span className={theme.section.title}>{title}</span>
        <svg
          className={`${theme.section.collapsible.icon} ${
            isOpen ? theme.section.collapsible.iconOpen : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className={theme.section.collapsible.content}>{children}</div>
      )}
    </div>
  );
};

interface GridContainerProps {
  children: React.ReactNode;
}

export const GridContainer: React.FC<GridContainerProps> = ({ children }) => {
  const theme = useFormTheme();
  return <div className={theme.grid.container}>{children}</div>;
};

interface FormSectionProps {
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, collapsible = false, defaultOpen = true, children }) => {
  const theme = useFormTheme();

  if (!title) {
    return <div className={theme.section.content}>{children}</div>;
  }

  if (collapsible) {
    return (
      <CollapsibleSection title={title} defaultOpen={defaultOpen}>
        <div className={theme.section.content}>{children}</div>
      </CollapsibleSection>
    );
  }

  return (
    <div className={theme.section.container}>
      <div className={theme.section.header}>
        <h3 className={theme.section.title}>{title}</h3>
      </div>
        <div className={theme.section.content}>{children}</div>
    </div>
  );
};
