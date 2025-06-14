"use client"

import Modal from "@/components/ui/modal"

const dummyFantasy = {
  title: "",
  description: "",
  image_url: "",

  status: "idea" as const,
  created_by: "",
  assigned_to: "",
  category: "",
}


export default function ImageModal({
  title,
  onClose,
  imageUrl,
  note,
}: {
  title: string
  onClose: () => void
  imageUrl: string
  note: string
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      readOnly
      newFantasy={dummyFantasy}
      setNewFantasy={() => {}}
      isCreateMode={false}
      onCreate={async () => {}}
      onEdit={async () => {}}
      onDelete={async () => {}}
      fantasy={undefined}

    >
      <img src={imageUrl} alt="Memory" className="w-full rounded mb-4" />
      <p className="text-base whitespace-pre-wrap">{note}</p>
    </Modal>
  )
}
