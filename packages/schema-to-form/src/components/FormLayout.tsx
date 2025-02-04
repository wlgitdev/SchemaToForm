import { useFormTheme } from "../contexts/ThemeContext";
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

export const FormSection: React.FC<FormSectionProps> = ({ title, collapsible, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const theme = useFormTheme();

  if (!title) {
    return <div className={theme.section.content}>{children}</div>;
  }

  return (
    <div className={theme.section.container}>
      <div className={theme.section.header}>
        <h3 className={theme.section.title}>{title}</h3>
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isOpen ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
      {(!collapsible || isOpen) && (
        <div className={theme.section.content}>{children}</div>
      )}
    </div>
  );
};
