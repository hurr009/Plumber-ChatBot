import ChatWindow from "@/components/ChatWindow";

// This page is rendered inside the iframe injected by widget.js.
export default function WidgetPage() {
  return (
    <div className="h-screen w-screen">
      <ChatWindow />
    </div>
  );
}
