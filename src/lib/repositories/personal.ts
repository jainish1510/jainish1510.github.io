import "server-only";
import { getContent } from "@/lib/store/load";

export const listNowItems = () => getContent().now;
export const listTimeline = () => getContent().timeline;
export const listLearning = () => getContent().learning;
export const listFacts = () => getContent().facts;
export const listBooks = () => getContent().books;
export const listInterests = () => getContent().interests;
export const listGoals = () => getContent().goals;
export const listSocialLinks = () => getContent().social.filter((s) => s.visible);
export const getWidgets = () => getContent().widgets;
