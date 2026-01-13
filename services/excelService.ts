
import * as XLSX from 'xlsx';
import { Mission } from '../types';

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const parseExcelFile = async (file: File): Promise<Mission[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];

        const missions: Mission[] = jsonData
          .map((row, index): Mission | null => {
            const keys = Object.keys(row);
            const dateKey = keys.find(k => k.toLowerCase().trim() === 'date');
            const missionKey = keys.find(k => k.toLowerCase().trim() === 'mission');

            if (!dateKey || !missionKey || !row[dateKey] || !row[missionKey]) return null;

            let rawDate = row[dateKey];
            let parsedDate: Date | null = null;
            
            if (typeof rawDate === 'string' && rawDate.includes('/')) {
              const parts = rawDate.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                let year = parseInt(parts[2], 10);
                if (year < 100) year += 2000;
                parsedDate = new Date(year, month, day);
              }
            }
            
            if (!parsedDate || isNaN(parsedDate.getTime())) {
              if (rawDate instanceof Date) parsedDate = rawDate;
              else if (typeof rawDate === 'number') parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
              else parsedDate = new Date(rawDate);
            }

            if (isNaN(parsedDate.getTime())) return null;

            const details: Record<string, any> = {};
            keys.forEach(key => {
              if (!key.startsWith('__')) {
                const val = row[key];
                details[key] = (val instanceof Date) ? val.toLocaleDateString() : val;
              }
            });

            return {
              id: `mission-${index}-${Date.now()}`,
              date: normalizeDate(parsedDate),
              mission: String(row[missionKey]),
              details: details
            };
          })
          .filter((m): m is Mission => m !== null);

        if (missions.length === 0) {
          reject(new Error('Format invalide. Colonnes "date" et "mission" requises.'));
          return;
        }

        resolve(missions);
      } catch (error) {
        reject(new Error('Erreur de lecture du fichier Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsArrayBuffer(file);
  });
};
