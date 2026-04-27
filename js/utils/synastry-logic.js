export function calculateSynastryScores(person1, person2) {
    // Basic validation
    if (!person1?.name || !person2?.name) {
        return {
            emotion: 0,
            communication: 0,
            passion: 0,
            stability: 0,
            total: 0
        };
    }

    const signature = [
        person1.name,
        person1.birthDate || '',
        person2.name,
        person2.birthDate || ''
    ].join('|').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    let seed = 0;
    for (let i = 0; i < signature.length; i++) {
        seed = (seed * 31 + signature.charCodeAt(i)) % 9973;
    }

    // Ensure scores are within 0-100 range and are deterministic
    const emotionScore = 55 + (seed * 3 % 41);
    const commScore = 55 + (seed * 7 % 41);
    const passionScore = 55 + (seed * 5 % 41);
    const stabilityScore = 55 + (seed * 11 % 41);
    const totalScore = Math.floor((emotionScore + commScore + passionScore + stabilityScore) / 4);

    return {
        emotion: emotionScore,
        communication: commScore,
        passion: passionScore,
        stability: stabilityScore,
        total: totalScore
    };
}
