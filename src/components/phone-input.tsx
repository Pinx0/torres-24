"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ReactCountryFlag from "react-country-flag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Phone, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipo para un país
type Country = {
    code: string;
    name: string;
    dialCode: string;
    pattern: RegExp; // Pattern completo con prefijo para validación JavaScript
    numberPattern: string; // Pattern solo para el número (sin prefijo) para validación HTML5
    minDigits: number;
    maxDigits: number;
    placeholder: string;
};

// Lista de países comunes con sus códigos y banderas
const COUNTRIES: Country[] = [
    // España: acepta "600 123 123" o "600123123" (9 dígitos)
    { code: "ES", name: "España", dialCode: "+34", pattern: /^\+34\d{9}$/, numberPattern: "^\\d{3}\\s?\\d{3}\\s?\\d{3}$", minDigits: 9, maxDigits: 9, placeholder: "600 000 000" },
    { code: "FR", name: "Francia", dialCode: "+33", pattern: /^\+33\d{9}$/, numberPattern: "^\\d{1}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}$", minDigits: 9, maxDigits: 9, placeholder: "6 12 34 56 78" },
    { code: "IT", name: "Italia", dialCode: "+39", pattern: /^\+39\d{9,10}$/, numberPattern: "^\\d{9,10}$", minDigits: 9, maxDigits: 10, placeholder: "300 000 0000" },
    { code: "PT", name: "Portugal", dialCode: "+351", pattern: /^\+351\d{9}$/, numberPattern: "^\\d{9}$", minDigits: 9, maxDigits: 9, placeholder: "912 345 678" },
    { code: "DE", name: "Alemania", dialCode: "+49", pattern: /^\+49\d{10,11}$/, numberPattern: "^\\d{10,11}$", minDigits: 10, maxDigits: 11, placeholder: "151 234 5678" },
    { code: "GB", name: "Reino Unido", dialCode: "+44", pattern: /^\+44\d{10}$/, numberPattern: "^\\d{10}$", minDigits: 10, maxDigits: 10, placeholder: "7700 900000" },
    { code: "US", name: "Estados Unidos", dialCode: "+1", pattern: /^\+1\d{10}$/, numberPattern: "^\\d{10}$", minDigits: 10, maxDigits: 10, placeholder: "(555) 123-4567" },
    { code: "MX", name: "México", dialCode: "+52", pattern: /^\+52\d{10}$/, numberPattern: "^\\d{10}$", minDigits: 10, maxDigits: 10, placeholder: "55 1234 5678" },
    { code: "AR", name: "Argentina", dialCode: "+54", pattern: /^\+54\d{10}$/, numberPattern: "^\\d{10}$", minDigits: 10, maxDigits: 10, placeholder: "11 1234 5678" },
    { code: "CO", name: "Colombia", dialCode: "+57", pattern: /^\+57\d{10}$/, numberPattern: "^\\d{10}$", minDigits: 10, maxDigits: 10, placeholder: "300 123 4567" },
    { code: "CL", name: "Chile", dialCode: "+56", pattern: /^\+56\d{9}$/, numberPattern: "^\\d{9}$", minDigits: 9, maxDigits: 9, placeholder: "9 1234 5678" },
    { code: "PE", name: "Perú", dialCode: "+51", pattern: /^\+51\d{9}$/, numberPattern: "^\\d{9}$", minDigits: 9, maxDigits: 9, placeholder: "987 654 321" },
];

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean) => void;
    disabled?: boolean;
    className?: string;
    name?: string;
}

export function PhoneInput({ value, onChange, onValidationChange, disabled, className, name }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Parsear el valor actual para extraer el país y el número
    const parsedValue = useMemo(() => {
        if (!value) return { country: COUNTRIES[0], number: "" };

        // Buscar el país que coincida con el prefijo (ordenar por longitud de dialCode para coincidencias más largas primero)
        const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        const matchingCountry = sortedCountries.find(country =>
            value.startsWith(country.dialCode)
        ) || COUNTRIES[0];

        // Extraer el número sin el prefijo
        const number = value.replace(matchingCountry.dialCode, "").trim();

        return { country: matchingCountry, number };
    }, [value]);

    const selectedCountry = parsedValue.country;

    const filteredCountries = useMemo(() => {
        if (!searchQuery) return COUNTRIES;
        const query = searchQuery.toLowerCase();
        return COUNTRIES.filter(
            country =>
                country.name.toLowerCase().includes(query) ||
                country.dialCode.includes(query) ||
                country.code.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleCountrySelect = (country: Country) => {
        // Mantener el número actual si existe, o empezar vacío
        const currentNumber = parsedValue.number || "";
        onChange(country.dialCode + currentNumber);
        setIsOpen(false);
        setSearchQuery("");
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir dígitos y limitar según el país
        const digits = e.target.value.replace(/\D/g, "");
        // Limitar a maxDigits
        const limitedDigits = digits.slice(0, selectedCountry.maxDigits);
        onChange(selectedCountry.dialCode + limitedDigits);
    };

    const formatNumber = (number: string): string => {
        // Formatear según el país (formato básico para España)
        if (selectedCountry.code === "ES") {
            if (number.length <= 3) return number;
            if (number.length <= 6) return `${number.slice(0, 3)} ${number.slice(3)}`;
            return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 9)}`;
        }
        // Para otros países, mostrar sin formato especial
        return number;
    };

    const displayNumber = formatNumber(parsedValue.number);
    // Validación JavaScript: usar el pattern completo con prefijo
    const fullPhoneNumber = selectedCountry.dialCode + parsedValue.number.replace(/\s/g, "");
    const isValid = !parsedValue.number || selectedCountry.pattern.test(fullPhoneNumber);

    // Calcular minLength basado en el formato esperado (incluyendo espacios)
    // Para España: "600 123 123" = 11 caracteres (9 dígitos + 2 espacios)
    const calculateMinLength = (country: Country): number => {
        if (country.code === "ES") {
            // Formato: XXX XXX XXX = minDigits + 2 espacios
            return country.minDigits + 2;
        }
        // Para otros países sin formato especial, usar minDigits
        return country.minDigits;
    };

    const minLengthForDisplay = calculateMinLength(selectedCountry);

    // Notificar cambios en la validación al componente padre
    useEffect(() => {
        onValidationChange?.(isValid || !parsedValue.number);
    }, [isValid, parsedValue.number, onValidationChange]);

    return (
        <div className={cn("relative", className)}>
            <div className="relative flex group">
                {/* Selector de país */}
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-r-none border-r-0 h-10 px-3 flex items-center gap-2 shrink-0 bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all border-2 border-input border-r-transparent group-focus-within:border-primary/50"
                                disabled={disabled}
                            />
                        }
                    >
                        <ReactCountryFlag
                            countryCode={selectedCountry.code}
                            svg
                            style={{
                                width: '1.5em',
                                height: '1.5em',
                            }}
                            title={selectedCountry.name}
                        />
                        <span className="text-sm font-semibold">{selectedCountry.dialCode}</span>
                        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 shadow-xl border-2" align="start">
                        <div className="p-3 border-b bg-muted/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar país..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors",
                                        selectedCountry.code === country.code && "bg-accent/50"
                                    )}
                                >
                                    <ReactCountryFlag
                                        countryCode={country.code}
                                        svg
                                        style={{
                                            width: '1.25em',
                                            height: '1.25em',
                                        }}
                                        title={country.name}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold">{country.name}</div>
                                        <div className="text-xs text-muted-foreground">{country.dialCode}</div>
                                    </div>
                                    {selectedCountry.code === country.code && (
                                        <span className="text-primary font-bold">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Input de número */}
                <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10 transition-colors group-focus-within:text-primary" />
                    <Input
                        type="tel"
                        name={name}
                        placeholder={selectedCountry.placeholder}
                        value={displayNumber}
                        onChange={handleNumberChange}
                        required
                        minLength={minLengthForDisplay}
                        maxLength={selectedCountry.maxDigits + 4} // +4 para espacios en el formato
                        title={`El teléfono debe tener el formato: ${selectedCountry.dialCode} ${selectedCountry.placeholder} (${selectedCountry.minDigits === selectedCountry.maxDigits ? selectedCountry.minDigits : `${selectedCountry.minDigits}-${selectedCountry.maxDigits}`} dígitos)`}
                        autoComplete="off"
                        disabled={disabled}
                        className="pl-10 rounded-l-none h-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 border-2 border-l-0 group-focus-within:border-primary/50"
                        aria-invalid={!isValid && parsedValue.number ? "true" : "false"}
                    />
                </div>
            </div>
            {!isValid && parsedValue.number && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-1.5 font-medium" role="alert"
                >
                    El formato no coincide con {selectedCountry.name}. Debe tener {selectedCountry.minDigits === selectedCountry.maxDigits ? selectedCountry.minDigits : `entre ${selectedCountry.minDigits} y ${selectedCountry.maxDigits}`} dígitos.
                </motion.p>
            )}
        </div>
    );
}
