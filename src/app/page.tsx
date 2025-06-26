import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <main className="flex flex-col items-center gap-8 w-full max-w-xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 text-center">KConvert App</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-lg">
          Convert and edit your images and videos directly in your browser. Fast, private, and easy to use. No files ever leave your device.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
          <Link href="/image-converter" legacyBehavior>
            <a className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg text-center text-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition">Image Converter</a>
          </Link>
          <Link href="/video-converter" legacyBehavior>
            <a className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg text-center text-lg font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition">Video Converter & Editor</a>
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
          <p>All processing is done in your browser for maximum privacy.</p>
          <p className="mt-1">Built with Next.js & Tailwind CSS.</p>
        </div>
      </main>
    </div>
  );
}
