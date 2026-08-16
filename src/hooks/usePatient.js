import { useState, useEffect } from 'react';
import { getPatientById, getPatientByEmail } from '@/lib/patients';

export function usePatient(id) {
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found

  useEffect(() => {
    let active = true;
    if (!id) {
      setStatus('not-found');
      return;
    }

    setStatus('loading');
    getPatientById(id)
      .then(found => {
        if (!active) return;
        if (found) {
          setPatient(found);
          setStatus('ready');
        } else {
          setStatus('not-found');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  return { patient, setPatient, status, setStatus };
}

export function usePatientByEmail(email) {
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found

  useEffect(() => {
    let active = true;
    if (!email) {
      setStatus('not-found');
      return;
    }

    setStatus('loading');
    getPatientByEmail(email)
      .then(found => {
        if (!active) return;
        if (found) {
          setPatient(found);
          setStatus('ready');
        } else {
          setStatus('not-found');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [email]);

  return { patient, setPatient, status, setStatus };
}
