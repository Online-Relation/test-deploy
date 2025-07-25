// src/pages/EditPanelPage.jsx
'use client';
import React from "react";
import EditPanelDemo from "@/components/EditPanelDemo";

export default function EditPanelPage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Edit Panel Demo Side</h1>
      <p>Her kan du teste inline edit panel uden modal.</p>
      <EditPanelDemo />
    </main>
  );
}
