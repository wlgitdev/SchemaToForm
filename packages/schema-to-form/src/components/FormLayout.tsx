// components/FormLayout.tsx
import React, { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 border rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left 
          px-4 py-3 bg-gray-50 hover:bg-gray-100
          transition-colors duration-150 ease-in-out border-b
          ${isOpen ? "border-gray-200" : "border-transparent"}`}
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
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
        <div
          className={`${isOpen ? '' : 'hidden'} 
          bg-white px-4 py-4 border-gray-100`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface GridContainerProps {
  columns?: number;
  gap?: number;
  children: React.ReactNode;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  columns = 1,
  gap = 4,
  children,
}) => {
  const gridClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }[columns] || "grid-cols-1";

  const gapClass = `gap-${gap}`;

  return <div className={`grid ${gridClass} ${gapClass}`}>{children}</div>;
};

interface FormSectionProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  columns?: number;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  collapsible = false,
  defaultOpen = true,
  columns = 1,
  children,
}) => {
  const content = (
    <>
      {(title || description) && !collapsible && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <GridContainer columns={columns}>{children}</GridContainer>
    </>
  );

  if (collapsible) {
    return (
      <CollapsibleSection title={title || ""} defaultOpen={defaultOpen}>
        {description && (
          <p className="text-sm text-gray-500 mb-4">{description}</p>
        )}
        {content}
      </CollapsibleSection>
    );
  }

  return <div className="mb-6 p-4 border rounded-lg bg-white">{content}</div>;
};
