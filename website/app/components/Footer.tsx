type FooterProps = {
  centered?: boolean;
  showBuiltWith?: boolean;
};

export function Footer({ centered = false, showBuiltWith = false }: FooterProps) {
  return (
    <footer className={`text-gray-500 dark:text-gray-600 text-xs ${centered ? 'text-center' : 'text-left'} font-mono tracking-wide border-t border-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700 pt-8 mt-8`}>
      {showBuiltWith ? (
        <div className="flex justify-between items-center">
          <span>© 2025 Greg Pstrucha</span>
          <span className="text-gray-400 dark:text-gray-700">Built with React Router</span>
        </div>
      ) : (
        <span>© 2025 Greg Pstrucha</span>
      )}
    </footer>
  );
}
