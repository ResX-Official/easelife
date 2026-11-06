"use client";

import { useEffect } from "react";
import { saveListing } from "@/lib/my-listings";

export function SaveToMyListings(props: {
  id: string;
  token: string;
  title: string;
  city: string;
  state: string;
}) {
  const { id, token, title, city, state } = props;
  useEffect(() => {
    saveListing({ id, token, title, city, state });
  }, [id, token, title, city, state]);

  return null;
}
