export default function Footer() {
  return (
    <footer className="bg-green-600 text-white text-center py-4 mt-10">
      <p className="text-sm">
        © {new Date().getFullYear()} AdventConnect. All rights reserved.
      </p>
    </footer>
  );
}
