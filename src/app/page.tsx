"use client";

import { useState, useEffect } from "react";

const skills = [
  "C/C++",
  "Linux",
  "Python",
  "ROS",
  "Jetson Nano",
  "Raspberry Pi",
  "UAV",
  "OpenCV",
];

const content = {
  en: {
    greeting: "Hello, I'm",
    tagline: "Software Engineer · Linux · C++ · Embedded Systems",
    aboutLabel: "About",
    skillsLabel: "Skills",
    aboutP1: (
      <>
        I&apos;m{" "}
        <span className="text-neutral-100 font-medium">Cheng, Yung-Chen</span>{" "}
        (鄭泳禎). I earned my B.S. in Computer Science from Tatung University,
        where I received the top academic award in my department, and my M.S.
        in Computer Science and Information Engineering from National Taipei
        University of Technology (NTUT).
      </>
    ),
    aboutP2: (
      <>
        My master&apos;s research focused on visual-inertial odometry for UAVs.
        Looking back, the most valuable part wasn&apos;t the algorithm itself —
        it was learning how to bring a system to life from scratch: sensor
        selection, hardware integration, environment setup, and field data
        collection. Flying my own drone on the university field to collect
        visual and IMU datasets taught me how much low-level system stability
        matters, and drew me toward development closer to the hardware.
      </>
    ),
    aboutP3: (
      <>
        I work comfortably with{" "}
        <span className="text-neutral-100">C++, Linux, and ROS</span>, and have
        hands-on experience deploying deep learning models on embedded
        platforms like the{" "}
        <span className="text-neutral-100">Jetson Nano</span>, tuning system
        parameters, and integrating external APIs across devices. I&apos;m now
        shifting my focus toward{" "}
        <span className="text-neutral-100">
          Linux systems, embedded firmware, and BMC / OpenBMC
        </span>{" "}
        — I believe a strong foundation in low-level systems is what lets an
        engineer grow for the long term.
      </>
    ),
    aboutP4: (
      <>
        Currently open to roles in{" "}
        <span className="text-neutral-100">
          BMC, firmware, and Linux systems engineering
        </span>
        .
      </>
    ),
  },
  zh: {
    greeting: "Hello, I'm",
    tagline: "軟體工程師 · Linux · C++ · 嵌入式系統",
    aboutLabel: "關於我",
    skillsLabel: "技能",
    aboutP1: (
      <>
        我是<span className="text-neutral-100 font-medium">鄭泳禎</span>
        ，大學畢業於大同大學資工系，曾獲系上品學兼優第一名；碩士則就讀於國立臺北科技大學資訊工程研究所。
      </>
    ),
    aboutP2: (
      <>
        碩士期間專注於無人機視覺定位研究，最大的收穫不是演算法本身，而是學會如何把一個從零開始的系統——從感測器選型、硬體整合、環境建置到資料收集——一步一步讓它真的能運作。我在學校操場自己飛無人機、收集視覺與
        IMU 資料集，這段經驗讓我體會到系統底層穩定性的重要，也讓我對更貼近硬體的開發領域產生興趣。
      </>
    ),
    aboutP3: (
      <>
        我熟悉 <span className="text-neutral-100">C++、Linux、ROS</span>{" "}
        環境下的開發與除錯，有在{" "}
        <span className="text-neutral-100">Jetson Nano</span>{" "}
        等嵌入式平台上部署深度學習模型、調校系統參數、並整合 OpenAI API
        完成多裝置溝通的實務經驗。目前正在把重心轉向{" "}
        <span className="text-neutral-100">
          Linux 系統、嵌入式韌體、以及 BMC / OpenBMC
        </span>{" "}
        領域，相信底層系統的扎實訓練是工程師長期發展的基礎。
      </>
    ),
    aboutP4: (
      <>
        找工作方向涵蓋{" "}
        <span className="text-neutral-100">
          BMC、一般韌體、Linux 系統開發
        </span>
        等職務。
      </>
    ),
  },
};

export default function Home() {
  const [lang, setLang] = useState<"en" | "zh">("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "zh" | null;
    if (saved) setLang(saved);
  }, []);

  const toggleLang = () => {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const t = content[lang];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="fixed top-6 right-6 z-50 text-xs tracking-[0.2em] text-neutral-500 hover:text-neutral-100 transition-colors"
        aria-label="Toggle language"
      >
        {lang === "en" ? "中文" : "EN"}
      </button>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-2xl w-full">
          <p className="text-sm text-neutral-500 mb-4 tracking-wide">
            {t.greeting}
          </p>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            Jameswim
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed mb-10">
            {t.tagline}
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
        </div>
      </section>

      {/* About Section */}
      <section className="px-6 py-24 sm:py-32 border-t border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-8">
            {t.aboutLabel}
          </p>

          <div className="space-y-6 text-neutral-300 leading-relaxed">
            <p>{t.aboutP1}</p>
            <p>{t.aboutP2}</p>
            <p>{t.aboutP3}</p>
            <p className="text-neutral-400 pt-4">{t.aboutP4}</p>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="px-6 py-24 sm:py-32 border-t border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-8">
            {t.skillsLabel}
          </p>

          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 text-sm text-neutral-300 border border-neutral-800 rounded-full hover:border-neutral-600 hover:text-neutral-100 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}