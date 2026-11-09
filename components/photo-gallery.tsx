"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function PhotoGallery({ photos, title }: { photos: { id: string; url: string }[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function show(index: number) {
    setActive(index);
    dialog.current?.showModal();
    setOpen(true);
  }

  function move(direction: number) {
    setActive(index => (index + direction + photos.length) % photos.length);
  }

  if (!photos.length) return <div className="empty-panel mb-10">Photos coming soon</div>;

  return <>
    <div className="relative">
      <div className={`property-gallery ${photos.length > 1 ? "has-secondary" : ""}`}>
        {photos.slice(0, 3).map((photo, index) => <button type="button" key={photo.id} className={`${index === 0 ? "gallery-main" : "gallery-secondary"} cursor-zoom-in focus-visible:outline-4 focus-visible:outline-blue-500`} aria-label={`Open photo ${index + 1} of ${photos.length}`} onClick={() => show(index)}>
          <Image src={photo.url} alt={`${title} — photo ${index + 1}`} fill preload={index === 0} sizes={index === 0 ? "(min-width: 1024px) 750px, 100vw" : "(min-width: 640px) 350px, 50vw"} className="object-cover" />
        </button>)}
      </div>
      <button type="button" className="absolute bottom-4 right-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-950 shadow-md" onClick={() => show(0)}>View {photos.length === 1 ? "photo" : `all ${photos.length} photos`}</button>
    </div>
    <dialog ref={dialog} aria-label={`Photos of ${title}`} className="photo-dialog" onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); dialog.current?.close(); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    }}>
      {open && <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 p-4 text-white">
          <p aria-live="polite" aria-atomic="true">Photo {active + 1} of {photos.length}</p>
          <button type="button" autoFocus aria-label="Close photo gallery" className="rounded-full p-3 hover:bg-white/20" onClick={() => dialog.current?.close()}><X /></button>
        </div>
        <div className="relative min-h-0 flex-1" style={{ touchAction: "pan-y" }} onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={event => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (start && Math.abs(end.clientX - start.x) > 50 && Math.abs(end.clientX - start.x) > Math.abs(end.clientY - start.y)) move(end.clientX < start.x ? 1 : -1);
        }}>
          <Image key={photos[active].id} src={photos[active].url} alt={`${title} — photo ${active + 1}`} fill sizes="100vw" className="object-contain" />
          {photos.length > 1 && <>
            <button type="button" aria-label="Previous photo" className="absolute left-2 top-1/2 rounded-full bg-black/60 p-3 text-white" onClick={() => move(-1)}><ChevronLeft /></button>
            <button type="button" aria-label="Next photo" className="absolute right-2 top-1/2 rounded-full bg-black/60 p-3 text-white" onClick={() => move(1)}><ChevronRight /></button>
          </>}
        </div>
        <p className="p-4 text-center text-sm text-white/80">{photos.length > 1 ? "Swipe or use the arrows to see more photos." : title}</p>
      </div>}
    </dialog>
  </>;
}
