import ImageComposer from "./components/ImageComposer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05070f] to-[#0b1020] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            FB Image text (ฟรี/ไม่เก็บ DB)
          </h1>
          <p className="mt-1 text-sm text-white/60">
            ทำภาพ 960×1200 + ข้อความไทยในภาพ + Download PNG พร้อมโพสต์
          </p>
        </header>

        <ImageComposer />
      </div>
    </main>
  );
}
