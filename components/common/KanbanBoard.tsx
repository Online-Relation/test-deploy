// components/common/KanbanBoard.tsx
"use client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { ReactNode } from "react";
import { ExtendedModalObject } from "@/components/ui/globalmodal/ModalCard";


type Column = { key: string; label: string };

// KanbanCard har nu alle nødvendige felter som ModalCard forventer
type KanbanCard = ExtendedModalObject & {
  status: string; // status skal være med
};

type KanbanBoardProps = {
  columns: Column[];
  cards: KanbanCard[];
  onUpdateStatus: (id: string, newStatus: string) => void;
  renderCard: (card: KanbanCard, idx: number) => ReactNode;
  onCreateCard?: (status: string) => void;
};

export default function KanbanBoard({
  columns,
  cards,
  onUpdateStatus,
  renderCard,
  onCreateCard,
}: KanbanBoardProps) {
  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    onUpdateStatus(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {columns.map((col) => (
          <Droppable droppableId={col.key} key={col.key}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-gray-50 rounded-xl p-4 min-h-[350px] flex flex-col border border-gray-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">{col.label}</h2>
                  {onCreateCard && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onCreateCard(col.key)}
                    >
                      +
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {cards
                    .filter((c) => c.status === col.key)
                    .map((card, idx) => (
                      <Draggable
                        key={card.id}
                        draggableId={card.id}
                        index={idx}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.7 : 1,
                            }}
                          >
                            {renderCard(card, idx)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
