export function AdminWorkspace() {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      {[
        { title: "Departments", hint: "Add and manage department records." },
        { title: "Locations", hint: "Create attendance locations and classroom coordinates." },
        { title: "User Location Mapping", hint: "Bind users to allowed attendance locations." }
      ].map((card) => (
        <article key={card.title} className="frame p-6">
          <div className="section-title">{card.title}</div>
          <div className="space-y-3">
            <input placeholder={`${card.title} code`} />
            <input placeholder={`${card.title} name`} />
            <button className="w-full rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-4 py-3 text-sm font-semibold text-white">
              Save {card.title}
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-textMuted">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
