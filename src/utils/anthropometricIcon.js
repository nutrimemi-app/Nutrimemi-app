export const getAnthropometricIconSrc = (gender, profile) => {
  if (gender === 'female') {
    const fileName =
      profile === 'BAJO PESO'
        ? 'BAJO PESO'
        : profile === 'NORMOPESO' || profile === 'NORMO PESO'
        ? 'NORMOPESO'
        : profile?.includes('OBESIDAD II') || profile?.includes('OBESIDAD III')
        ? 'OBESIDAD II,III'
        : profile?.includes('OBESIDAD')
        ? 'OBESIDAD'
        : 'SOBRE PESO';
    return `/ICONO ANTROPOMETRIA FEMENINO/FEMENINO_${fileName}.svg`;
  } else {
    // Masculino
    const fileName =
      profile === 'BAJO PESO'
        ? 'BAJO PESO'
        : profile === 'NORMOPESO' || profile === 'NORMO PESO'
        ? 'NORMO PESO'
        : profile?.includes('OBESIDAD')
        ? 'OBESIDAD'
        : 'SOBRE PESO';
    return `/ICONO ANTROPOMETRIA MASCULINO/MASCULINO_${fileName}.svg`;
  }
};
