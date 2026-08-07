"use client";

import { blo } from "blo";

export function Identicon({ address }: { address: string }) {
    const formattedAddress = (
        address.startsWith("0x") ? address : `0x${address}`
    ) as `0x${string}`;
    return (
        <img
            src={blo(formattedAddress)}
            alt={address}
            className="w-7 h-7 rounded-full flex-shrink-0 border border-neutral-700/80 shadow-sm object-cover select-none bg-neutral-800"
        />
    );
}
