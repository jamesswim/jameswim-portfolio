export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <section className="max-w-2xl w-full">
        <p className="text-sm text-neutral-500 mb-4 tracking-wide">
          Hello, I&apos;m
        </p>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
          Jameswim
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed mb-10">
          Software Engineer · Linux · C++ · Embedded Systems
        </p>

        <div className="flex gap-6 items-center text-sm tracking-wide">
          <a
            href="https://github.com/jamesswim"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            GitHub
          </a>

          <a
            href="mailto:james384712@gmail.com"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            Email
          </a>

          <a
            href="https://www.youtube.com/@jameswim1107"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            YouTube
          </a>

          <a
            href="https://www.instagram.com/jameswim_csie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            Instagram
          </a>
        </div>
      </section>
    </main>
  );
}