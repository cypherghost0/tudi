import React from "react";
 
export function CustomerSearch({ onSearch }: { onSearch?: (query: string) => void }) {
  const [query, setQuery] = React.useState('');
 
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch?.(query);
  }
 
  return (
    <form className="flex gap-2 py-2" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={("searchPlaceholder")}
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border rounded px-2 py-1"
      />
      <button type="submit" className="bg-primary text-primary-foreground rounded px-4 py-2">{("searchButton")}</button>
    </form>
  );
}
