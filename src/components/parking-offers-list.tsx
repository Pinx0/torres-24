"use client";

import { ParkingOffer } from "@/app/parking/actions";
import { ParkingOfferCard } from "@/components/parking-offer-card";

interface ParkingOffersListProps {
  offers: ParkingOffer[];
  currentFamilyCode: string;
}

export function ParkingOffersList({ offers, currentFamilyCode }: ParkingOffersListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <ParkingOfferCard
          key={offer.id}
          offer={offer}
          isMyOffer={offer.unidad_familiar_codigo === currentFamilyCode}
        />
      ))}
    </div>
  );
}
