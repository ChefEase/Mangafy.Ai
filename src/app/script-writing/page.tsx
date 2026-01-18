"use client";
import ScriptWritingClient from "../../components/ScriptEditor/ScriptWritingClient";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading script editor...</div>}>
      <ScriptWritingClient />
    </Suspense>
  );
}
