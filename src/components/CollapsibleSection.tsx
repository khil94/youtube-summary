import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | string>(
    defaultOpen ? "auto" : 0
  );
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(isOpen ? scrollHeight : 0);
    }
  }, [isOpen, children]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex justify-between items-center hover:bg-gray-750 transition-colors cursor-pointer"
      >
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <div className="transform transition-transform duration-300">
          {isOpen ? (
            <ChevronUpIcon className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>
      <div
        ref={contentRef}
        style={{
          height: height,
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
        }}
      >
        <div className="p-6 pt-0">{children}</div>
      </div>
    </div>
  );
}
