// /config/notificationsConfig.ts
export type NotificationTypeKey = 
  | 'quiz_pending'
  | 'fantasy_added'
  | 'bucket_deadline';

export interface NotificationTypeDef {
  label: string;
  template: string;
  linkType: 'quiz' | 'fantasy' | 'bucket';
  linkField: string;
  icon?: string;
}

export const notificationTypes: Record<NotificationTypeKey, NotificationTypeDef> = {
  quiz_pending: {
    label: "Quiz mangler svar",
    template: "{otherUser} har fuldført quizzen '{quizTitle}' – du mangler at svare!",
    linkType: "quiz",
    linkField: "quizId",
    icon: "QuizIcon",
  },
  fantasy_added: {
    label: "Ny fantasi tilføjet",
    template: "Der er tilføjet en ny fantasi: '{fantasyTitle}'",
    linkType: "fantasy",
    linkField: "fantasyId",
    icon: "StarIcon",
  },
  bucket_deadline: {
    label: "Deadline nærmer sig",
    template: "Du har en deadline på din bucketlist: '{bucketTitle}'",
    linkType: "bucket",
    linkField: "bucketId",
    icon: "CalendarIcon",
  },
};
