export const symptomOptions = [
  { id: "noise", label: "Motor fazendo barulho" },
  { id: "shaking", label: "Carro tremendo" },
  { id: "dashboard", label: "Luz acesa no painel" },
  { id: "overheating", label: "Carro esquentando" },
  { id: "starting", label: "Problema para ligar" },
  { id: "wheels", label: "Problema nas rodas ou freios" },
  { id: "other", label: "Outro problema" },
] as const;

export type SymptomId = (typeof symptomOptions)[number]["id"];
export type Assessment = {
  possibleCauses: string[];
  attentionLevel: "LOW" | "MODERATE" | "HIGH";
  recommendation: string;
};

export function createAssessment(symptom: SymptomId, answers: Record<string, string>): Assessment {
  const when = (answers.when ?? "").toLocaleLowerCase("pt-BR");
  switch (symptom) {
    case "noise":
      return {
        possibleCauses: ["Pode estar relacionado ao nível ou à circulação do óleo.", "Uma correia ou peça móvel também pode produzir ruídos."],
        attentionLevel: when.includes("acelera") ? "MODERATE" : "LOW",
        recommendation: "Evite acelerar para testar. Agende uma avaliação com um profissional e descreva quando o ruído aparece.",
      };
    case "shaking":
      return {
        possibleCauses: ["Pneus desbalanceados ou com desgaste irregular.", "Pode haver algo a verificar na suspensão ou nas rodas."],
        attentionLevel: when.includes("fren") ? "HIGH" : "MODERATE",
        recommendation: when.includes("fren")
          ? "Por segurança, evite continuar dirigindo e peça a um profissional para avaliar os freios."
          : "Dirija com cuidado e agende uma avaliação das rodas, pneus e suspensão.",
      };
    case "dashboard":
      return {
        possibleCauses: ["O aviso pode indicar desde uma leitura de sensor até a necessidade de manutenção.", "A cor e o símbolo da luz ajudam o profissional a identificar o que verificar."],
        attentionLevel: "MODERATE",
        recommendation: "Consulte o manual do veículo para identificar o símbolo. Se a luz for vermelha ou o carro perder força, pare em local seguro e peça ajuda.",
      };
    case "overheating":
      return {
        possibleCauses: ["Pode haver uma questão no sistema de arrefecimento.", "O nível do líquido ou uma mangueira podem precisar de verificação."],
        attentionLevel: "HIGH",
        recommendation: "Pare em local seguro, desligue o motor e espere esfriar. Não abra o reservatório quente. Peça ajuda antes de seguir viagem.",
      };
    case "starting":
      return {
        possibleCauses: ["A bateria pode estar descarregada ou perto do fim da vida útil.", "O sistema de partida ou a alimentação elétrica pode precisar de avaliação."],
        attentionLevel: "MODERATE",
        recommendation: "Evite insistir na partida repetidamente. Uma oficina pode testar a bateria e o sistema elétrico.",
      };
    case "wheels":
      return {
        possibleCauses: ["Pneu murcho, desgaste irregular ou roda desalinhada.", "Freios ou componentes da suspensão também podem exigir uma inspeção."],
        attentionLevel: "HIGH",
        recommendation: "Se a direção estiver instável ou houver ruído ao frear, não continue dirigindo. Solicite avaliação profissional.",
      };
    default:
      return {
        possibleCauses: ["O sintoma precisa de mais informações para ser compreendido.", "Uma inspeção presencial é a forma mais segura de encontrar a causa."],
        attentionLevel: "MODERATE",
        recommendation: "Descreva o que percebeu a uma oficina de confiança. Esta avaliação não substitui uma inspeção mecânica.",
      };
  }
}
