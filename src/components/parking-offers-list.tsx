"use client";

import { ParkingOffer } from "@/app/parking/actions";
import { ParkingOfferCard } from "@/components/parking-offer-card";

interface ParkingOffersListProps {
  offers: ParkingOffer[];
  currentFamilyCode: string;
}

export function ParkingOffersList({ offers, currentFamilyCode }: ParkingOffersListProps) {
  const now = new Date();
  const activeOffers = offers.filter((offer) => {
    const end = new Date(offer.fecha_fin);
    return Number.isNaN(end.getTime()) || end >= now;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {activeOffers.map((offer) => (
        <ParkingOfferCard
          key={offer.id}
          offer={offer}
          isMyOffer={offer.unidad_familiar_codigo === currentFamilyCode}
        />
      ))}
    </div>
  );
}
