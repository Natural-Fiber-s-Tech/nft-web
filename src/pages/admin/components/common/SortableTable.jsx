import React, { createContext, useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const RowContext = createContext({});

export const DragHandle = () => {
  const { attributes, listeners } = useContext(RowContext);
  return (
    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1.5 rounded-md inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors">
      <GripVertical className="w-4 h-4" />
    </div>
  );
};

export const SortableRowWrapper = ({ id, isTop3, children, className = "" }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? {
      position: "relative",
      zIndex: 9999,
      backgroundColor: "white",
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
    } : {})
  };

  const defaultClasses = `border-b transition-colors hover:bg-gray-50/75 ${
    isTop3 ? "bg-amber-50/40 border-amber-100" : "border-gray-100"
  } ${isDragging ? "opacity-95 ring-2 ring-red-500 rounded-lg" : ""}`;

  return (
    <RowContext.Provider value={{ attributes, listeners }}>
      <tr ref={setNodeRef} style={style} className={`${defaultClasses} ${className}`}>
        {children}
      </tr>
    </RowContext.Provider>
  );
};
