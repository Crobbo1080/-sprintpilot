"use client";
import React, { useMemo, useReducer, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  HelpCircle,
  Home,
  Lightbulb,
  Mic,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Star,
  Target,
  Timer,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

type Page = "dashboard" | "day1" | "day2" | "day3" | "day4" | "timer" | "resources" | "report";
type DayId = "day1" | "day2" | "day3" | "day4";
type Tab = "schedule" | "activities" | "guide" | "resources";
type ResourceTab = "templates" | "facilitation";
type HmwTab = "generate" | "saved" | "templates" | "guide";
type Colour = "blue" | "green" | "orange" | "purple";

type Activity = {
  id: string;
  title: string;
  duration: string;
  description: string;
  participants: string;
  materials: string[];
  deliverable: string;
  tips: string[];
  guideTitle: string;
  guideSubtitle: string;
};

type Artefact = {
  id: string;
  activityKey: string;
  type: "photo" | "note";
  name: string;
  dataUrl?: string;
  caption: string;
  noteKind?: "insight" | "opportunity" | "parking" | "decision" | "risk" | "question";
  createdAt: number;
};

const noteArtefactTypes = [
  { id: "insight", label: "Insight", icon: Lightbulb, color: "from-blue-500 to-blue-700" },
  { id: "opportunity", label: "Opportunity", icon: Target, color: "from-emerald-500 to-emerald-700" },
  { id: "parking", label: "Parking lot", icon: Star, color: "from-slate-500 to-slate-700" },
  { id: "decision", label: "Decision", icon: CheckCircle2, color: "from-purple-500 to-purple-700" },
  { id: "risk", label: "Risk", icon: Zap, color: "from-red-500 to-red-700" },
  { id: "question", label: "Question", icon: HelpCircle, color: "from-amber-500 to-amber-700" },
] as const;

function getNoteArtefactType(noteKind: Artefact["noteKind"]) {
  return noteArtefactTypes.find((type) => type.id === noteKind) ?? noteArtefactTypes[0];
}

type SprintDay = {
  id: DayId;
  label: string;
  title: string;
  subtitle: string;
  duration: string;
  colour: Colour;
  icon: React.ElementType;
  goal: string;
  middleLabel: string;
  middle: string;
  outcome: string;
  guideLabel: string;
  schedule: Array<{ time: string; title: string; duration: string; isBreak?: boolean }>;
  activities: Activity[];
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const colour = {
  blue: { solid: "bg-blue-600 text-white", text: "text-blue-600", soft: "bg-blue-50 text-blue-700 border-blue-200", border: "border-blue-600", ring: "ring-blue-100" },
  green: { solid: "bg-emerald-600 text-white", text: "text-emerald-600", soft: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-emerald-600", ring: "ring-emerald-100" },
  orange: { solid: "bg-orange-600 text-white", text: "text-orange-600", soft: "bg-orange-50 text-orange-700 border-orange-200", border: "border-orange-600", ring: "ring-orange-100" },
  purple: { solid: "bg-purple-600 text-white", text: "text-purple-600", soft: "bg-purple-50 text-purple-700 border-purple-200", border: "border-purple-600", ring: "ring-purple-100" },
};

const DAY_IDS: DayId[] = ["day1", "day2", "day3", "day4"];

function dayLabel(dayId: DayId) {
  return `Day ${dayId.replace("day", "")}`;
}

function activityKey(dayId: DayId, activityId: string) {
  return `${dayId}-${activityId}`;
}

function sprintProgressFillStyle(percent: number): React.CSSProperties {
  const safePercent = Math.max(0, Math.min(100, percent));

  return {
    width: safePercent === 0 ? "0%" : `${safePercent}%`,
    background:
      "linear-gradient(90deg, #3b82f6 0%, #3b82f6 25%, #10b981 50%, #f97316 75%, #a855f7 100%)",
    backgroundSize: safePercent === 0 ? "100% 100%" : `${10000 / safePercent}% 100%`,
    backgroundRepeat: "no-repeat",
  };
}

const day1Activities: Activity[] = [
  { id: "kickoff", title: "Sprint Kickoff", duration: "30 min", description: "Set the stage, align the team, and establish ground rules for the sprint.", participants: "All team members", materials: ["Agenda", "Sprint canvas", "Name tags"], deliverable: "Aligned team with clear sprint goals", tips: ["Start with introductions if needed", "Communicate the sprint format and expectations", "Create a parking lot for off-topic discussion"], guideTitle: "Sprint Planning & Preparation Guide", guideSubtitle: "Complete guide for setting up and preparing your design sprint for maximum success" },
  { id: "mapping", title: "Problem Mapping", duration: "60 min", description: "Create a visual map of the user journey to identify key problems and opportunities.", participants: "All team members", materials: ["Large sheets of paper", "Sticky notes", "Markers", "Timer"], deliverable: "Complete user journey map with pain points identified", tips: ["Focus on the user journey, not internal processes", "Separate assumptions from known facts", "Keep the map visible throughout the sprint"], guideTitle: "Problem Mapping Facilitation Guide", guideSubtitle: "How to facilitate effective problem mapping sessions to understand the challenge landscape" },
  { id: "interviews", title: "Expert Interviews", duration: "90 min", description: "Gather insight from people who understand the problem, users, operations, or constraints.", participants: "Experts + sprint team", materials: ["Interview questions", "Note sheets", "Timer"], deliverable: "Key insights and assumptions captured", tips: ["Ask open questions", "Keep interviews short and focused", "Capture direct quotes where useful"], guideTitle: "Expert Interview Facilitation Guide", guideSubtitle: "How to conduct effective expert interviews to gather insights and understand the problem deeply" },
  { id: "hmw", title: "How Might We", duration: "45 min", description: "Transform problems, insights, and opportunities into How Might We questions.", participants: "All team members", materials: ["Sticky notes", "Markers", "Timer"], deliverable: "50+ How Might We questions", tips: ["Start questions with ‘How might we…’", "One idea per sticky note", "Build on others’ ideas", "Go for quantity before quality"], guideTitle: "How Might We Workshop Guide", guideSubtitle: "Transform problems into opportunities with structured HMW question generation" },
  { id: "target", title: "Target Selection", duration: "45 min", description: "Choose the most important challenge or opportunity to focus on for the sprint.", participants: "All team members", materials: ["Voting dots", "Decision matrix", "Timer"], deliverable: "One target problem or opportunity selected", tips: ["Consider impact vs effort", "The Decider has the final say", "Choose something that can be prototyped and tested"], guideTitle: "Voting & Decision Framework", guideSubtitle: "Structured approach for making decisions and selecting targets" },
];

const sprintDays: SprintDay[] = [
  { id: "day1", label: "Day 1", title: "Day 1: Understand & Define", subtitle: "Map the problem, interview experts, and define the challenge", duration: "6-8 hours", colour: "blue", icon: Target, goal: "Define the right problem to solve", middleLabel: "Team", middle: "5-7 people including Decider", outcome: "Target problem selected", guideLabel: "Resources", schedule: [{ time: "9:00 AM", title: "Sprint Kickoff", duration: "30 min" }, { time: "9:30 AM", title: "Problem Mapping", duration: "60 min" }, { time: "10:30 AM", title: "Break", duration: "15 min", isBreak: true }, { time: "10:45 AM", title: "Expert Interviews", duration: "90 min" }, { time: "12:15 PM", title: "Lunch", duration: "60 min", isBreak: true }, { time: "1:15 PM", title: "How Might We", duration: "45 min" }, { time: "2:00 PM", title: "Break", duration: "15 min", isBreak: true }, { time: "2:15 PM", title: "Target Selection", duration: "45 min" }, { time: "3:00 PM", title: "Day 1 Wrap-up", duration: "30 min" }], activities: day1Activities },
  { id: "day2", label: "Day 2", title: "Day 2: Ideate & Decide", subtitle: "Generate solutions and decide on the best approach", duration: "6-8 hours", colour: "green", icon: Lightbulb, goal: "Select the best solution to prototype", middleLabel: "Focus", middle: "Individual work then group decisions", outcome: "Winning solution ready to prototype", guideLabel: "Sketching Guide", schedule: [{ time: "9:00 AM", title: "Day 2 Kickoff", duration: "15 min" }, { time: "9:15 AM", title: "Lightning Demos", duration: "45 min" }, { time: "10:15 AM", title: "Four-Step Sketch", duration: "90 min" }, { time: "12:00 PM", title: "Lunch", duration: "60 min", isBreak: true }, { time: "1:00 PM", title: "Art Museum", duration: "30 min" }, { time: "1:30 PM", title: "Speed Critique", duration: "60 min" }, { time: "3:00 PM", title: "Supervote", duration: "30 min" }], activities: [{ ...day1Activities[0], id: "lightning", title: "Lightning Demos", duration: "45 min", description: "Quick presentations of existing solutions and inspiration from other industries.", deliverable: "Collection of inspiring solutions and patterns" }, { ...day1Activities[3], id: "sketch", title: "Four-Step Sketch", duration: "90 min", description: "Individual sketching exercise to generate detailed solution ideas.", deliverable: "Individual solution sketches from each team member" }, { ...day1Activities[4], id: "supervote", title: "Supervote", duration: "30 min", description: "The Decider makes the final choice on what concept to prototype.", deliverable: "Winning concept selected" }] },
  { id: "day3", label: "Day 3", title: "Day 3: Prototype", subtitle: "Build a realistic prototype of your solution", duration: "6-8 hours", colour: "orange", icon: Wrench, goal: "Create a testable prototype", middleLabel: "Approach", middle: "Divide and conquer with roles", outcome: "Ready-to-test prototype", guideLabel: "Prototyping Guide", schedule: [{ time: "9:00 AM", title: "Day 3 Kickoff", duration: "15 min" }, { time: "9:15 AM", title: "Storyboard Creation", duration: "60 min" }, { time: "10:30 AM", title: "Prototype Planning", duration: "45 min" }, { time: "11:15 AM", title: "Prototype Building", duration: "5 hours" }, { time: "4:15 PM", title: "Prototype Review", duration: "45 min" }], activities: [{ ...day1Activities[1], id: "storyboard", title: "Storyboard Creation", duration: "60 min", description: "Create a step-by-step storyboard of the user experience.", deliverable: "Complete user journey storyboard" }, { ...day1Activities[4], id: "planning", title: "Prototype Planning", duration: "45 min", description: "Plan the prototype structure and assign responsibilities.", deliverable: "Prototype plan with clear responsibilities" }, { ...day1Activities[2], id: "building", title: "Prototype Building", duration: "5 hours", description: "Build a realistic-enough prototype that users can react to.", deliverable: "Realistic prototype ready for review" }] },
  { id: "day4", label: "Day 4", title: "Day 4: Test & Validate", subtitle: "Test with real users and gather feedback", duration: "4-6 hours", colour: "purple", icon: Zap, goal: "Validate solution with real users", middleLabel: "Users", middle: "5 individual testing sessions", outcome: "Validated insights & next steps", guideLabel: "Testing Guide", schedule: [{ time: "9:00 AM", title: "Day 4 Kickoff", duration: "15 min" }, { time: "9:15 AM", title: "Test Preparation", duration: "45 min" }, { time: "10:00 AM", title: "User Testing - Session 1", duration: "30 min" }, { time: "10:45 AM", title: "User Testing - Session 2", duration: "30 min" }, { time: "11:30 AM", title: "User Testing - Session 3", duration: "30 min" }, { time: "1:00 PM", title: "User Testing - Session 4", duration: "30 min" }, { time: "1:45 PM", title: "User Testing - Session 5", duration: "30 min" }, { time: "2:30 PM", title: "Results Analysis", duration: "60 min" }], activities: [{ ...day1Activities[0], id: "prep", title: "Test Preparation", duration: "45 min", description: "Prepare for user testing sessions — scripts, logistics, and roles.", deliverable: "Ready testing environment and materials" }, { ...day1Activities[2], id: "testing", title: "User Testing Sessions", duration: "3 hours", description: "Conduct 5 individual user testing sessions with your prototype.", deliverable: "User feedback and behavioural observations" }, { ...day1Activities[1], id: "analysis", title: "Results Analysis", duration: "60 min", description: "Look for patterns, validated assumptions, warning signs, and next steps.", deliverable: "Validated learning and recommended next actions" }] },
];

type ResourceGuide = {
  title: string;
  description: string;
  stage: string;
  audience: string;
  time: string;
  kind: "Playbook" | "Guide" | "Script" | "Template" | "Troubleshooting";
  icon: React.ElementType;
};

type GuideContent = {
  summary: string;
  useWhen: string[];
  steps: Array<{ title: string; detail: string }>;
  facilitatorPrompts: string[];
  checklist: string[];
  watchouts: string[];
  outputs: string[];
};

const resourceCategories: Array<{ title: string; description: string; guides: ResourceGuide[] }> = [
  {
    title: "Foundations",
    description: "Everything a new facilitator needs before the sprint starts.",
    guides: [
      {
        title: "What is a 4-Day Design Sprint?",
        description: "A simple overview of the sprint model, what each day is for, and what good outcomes look like.",
        stage: "Before the sprint",
        audience: "New facilitators",
        time: "10 min read",
        kind: "Guide",
        icon: BookOpen,
      },
      {
        title: "Sprint Setup & Logistics Guide",
        description: "How to choose the challenge, recruit the team, prepare the room, gather materials, and brief stakeholders.",
        stage: "Preparation",
        audience: "Facilitator + sponsor",
        time: "30-60 min prep",
        kind: "Playbook",
        icon: Settings,
      },
      {
        title: "Roles & Responsibilities",
        description: "Clear expectations for the Facilitator, Decider, sprint team, experts, note-takers, and testers.",
        stage: "Preparation",
        audience: "Whole team",
        time: "10 min read",
        kind: "Guide",
        icon: Users,
      },
    ],
  },
  {
    title: "Run the Sprint",
    description: "The end-to-end operating system for facilitating the room.",
    guides: [
      {
        title: "Sprint Facilitation Playbook",
        description: "The core guide for running the sprint live: pacing, room control, activity flow, decision moments, and daily rhythm.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Playbook",
        icon: Play,
      },
      {
        title: "Day Opening & Closing Scripts",
        description: "Ready-to-use wording for opening each day, setting expectations, recapping progress, and closing the room.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Script",
        icon: Mic,
      },
      {
        title: "Transitions & Instructions Library",
        description: "What to say between activities so participants understand the task, the timebox, and the output expected.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Script",
        icon: Send,
      },
    ],
  },
  {
    title: "Sprint Techniques",
    description: "Activity-specific guidance for the core sprint methods.",
    guides: [
      {
        title: "Problem Mapping Facilitation Guide",
        description: "How to map the user journey, identify pain points, and avoid jumping too early into solutions.",
        stage: "Day 1",
        audience: "Full sprint team",
        time: "60 min",
        kind: "Guide",
        icon: Target,
      },
      {
        title: "Expert Interview Guide",
        description: "How to brief experts, ask useful questions, capture signals, and turn answers into opportunities.",
        stage: "Day 1",
        audience: "Experts + team",
        time: "90 min",
        kind: "Guide",
        icon: Users,
      },
      {
        title: "How Might We Workshop Guide",
        description: "How to convert problems and insights into better HMW questions, including examples and quality checks.",
        stage: "Day 1",
        audience: "Full sprint team",
        time: "45 min",
        kind: "Guide",
        icon: HelpCircle,
      },
      {
        title: "Lightning Demos & Sketching Guide",
        description: "How to inspire ideas, run silent sketching, use Crazy 8s, and produce self-explanatory solution sketches.",
        stage: "Day 2",
        audience: "Full sprint team",
        time: "2-3 hours",
        kind: "Guide",
        icon: Lightbulb,
      },
      {
        title: "Voting & Decision Framework",
        description: "How to run dot voting, straw polls, critique, and Decider supervotes without losing momentum.",
        stage: "Day 2",
        audience: "Facilitator + Decider",
        time: "45-90 min",
        kind: "Guide",
        icon: CheckCircle2,
      },
      {
        title: "Prototyping Guide",
        description: "How to decide prototype fidelity, assign roles, use realistic content, and avoid overbuilding.",
        stage: "Day 3",
        audience: "Prototype team",
        time: "Full day",
        kind: "Guide",
        icon: Wrench,
      },
      {
        title: "User Testing Guide",
        description: "How to prepare scripts, run neutral sessions, observe behaviour, and capture reliable feedback.",
        stage: "Day 4",
        audience: "Facilitator + note-taker",
        time: "5 sessions",
        kind: "Guide",
        icon: Eye,
      },
    ],
  },
  {
    title: "Facilitation Skills",
    description: "Practical help for managing people, energy, conflict, and momentum.",
    guides: [
      {
        title: "Room Dynamics & Participation",
        description: "How to manage dominant voices, bring quiet people in, prevent groupthink, and maintain psychological safety.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Guide",
        icon: Users,
      },
      {
        title: "Energy, Pacing & Timeboxing",
        description: "How to keep the room moving, call time confidently, handle breaks, and recover when activities overrun.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Guide",
        icon: Timer,
      },
      {
        title: "Handling Conflict & Disagreement",
        description: "How to deal with challenge, disagreement, stakeholder tension, and difficult decision points constructively.",
        stage: "All days",
        audience: "Facilitator + Decider",
        time: "Use live",
        kind: "Guide",
        icon: Zap,
      },
    ],
  },
  {
    title: "Outputs & Reporting",
    description: "Turn messy sprint-wall activity into evidence, decisions, and a useful report.",
    guides: [
      {
        title: "Artefact Capture Guide",
        description: "How to photograph sprint walls, label outputs, theme notes, and capture evidence during live activities.",
        stage: "All days",
        audience: "Facilitator + note-taker",
        time: "Use live",
        kind: "Guide",
        icon: Download,
      },
      {
        title: "Synthesis & Insight Capture",
        description: "How to cluster notes, identify patterns, separate evidence from opinion, and turn findings into decisions.",
        stage: "Day 4 + after",
        audience: "Full sprint team",
        time: "60-90 min",
        kind: "Guide",
        icon: Star,
      },
      {
        title: "Sprint Report & Next Steps",
        description: "How to present outcomes, explain test evidence, recommend next actions, and brief stakeholders after the sprint.",
        stage: "After sprint",
        audience: "Facilitator + sponsor",
        time: "30-60 min",
        kind: "Template",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Troubleshooting",
    description: "What to do when the sprint gets messy, political, slow, or uncertain.",
    guides: [
      {
        title: "What If Things Go Wrong?",
        description: "Practical responses for common sprint problems: running late, weak ideas, disagreement, missing Decider, and unclear evidence.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Troubleshooting",
        icon: HelpCircle,
      },
      {
        title: "Remote & Hybrid Sprint Adjustments",
        description: "How to adapt facilitation, artefact capture, participation, testing, and decision-making for remote or hybrid groups.",
        stage: "Optional",
        audience: "Facilitator",
        time: "Use as needed",
        kind: "Guide",
        icon: Bot,
      },
    ],
  },
];

const resourceTemplateCards = [
  "Sprint Canvas",
  "Problem Map Template",
  "Expert Interview Script",
  "How Might We Worksheet",
  "Voting Board",
  "Storyboard Template",
  "Prototype Plan",
  "User Testing Script",
  "Report Template",
];

function allResourceGuides() {
  return resourceCategories.flatMap((category) => category.guides);
}

function getGuideByTitle(title: string) {
  const aliases: Record<string, string> = {
    "Sprint Planning & Preparation Guide": "Sprint Setup & Logistics Guide",
    "Problem Mapping Facilitation Guide": "Problem Mapping Facilitation Guide",
    "Expert Interview Facilitation Guide": "Expert Interview Guide",
    "How Might We Workshop Guide": "How Might We Workshop Guide",
    "Voting & Decision Framework": "Voting & Decision Framework",
    "Prototyping Guide": "Prototyping Guide",
    "User Testing Preparation Guide": "User Testing Guide",
    "User Testing Facilitation Guide": "User Testing Guide",
    "Test Results Analysis Guide": "Synthesis & Insight Capture",
    "Sprint Validation Framework": "Sprint Report & Next Steps",
    "Sketching Guide": "Lightning Demos & Sketching Guide",
    "Testing Guide": "User Testing Guide",
  };

  const resolvedTitle = aliases[title] ?? title;
  return allResourceGuides().find((guide) => guide.title === resolvedTitle) ?? null;
}

function getGuideContent(guide: ResourceGuide): GuideContent {
  switch (guide.title) {
    case "What is a 4-Day Design Sprint?":
      return {
        summary: "A 4-day design sprint is a structured workshop for moving from a high-risk problem to a realistic prototype tested with users. It compresses alignment, ideation, decision-making, prototyping, and validation into a focused sequence.",
        useWhen: ["You need to reduce uncertainty quickly", "A team is stuck debating options", "You need evidence before committing to delivery"],
        steps: [
          { title: "Day 1 — Understand & Define", detail: "Map the challenge, interview experts, surface assumptions, generate How Might We questions, and choose a focused target." },
          { title: "Day 2 — Ideate & Decide", detail: "Review inspiration, sketch possible solutions individually, critique silently, vote, and let the Decider choose the strongest direction." },
          { title: "Day 3 — Prototype", detail: "Create a realistic enough prototype that users can react to. Focus on the critical path, not the whole product." },
          { title: "Day 4 — Test & Validate", detail: "Run individual user tests, observe behaviour, capture evidence, identify patterns, and decide what should happen next." },
        ],
        facilitatorPrompts: [
          "The aim is not to build the final answer. The aim is to learn quickly.",
          "We will work alone together: individual thinking first, then structured group decisions.",
          "The Decider helps us keep momentum when there are several valid options.",
        ],
        checklist: ["Clear challenge", "Decider confirmed", "5-7 sprint participants", "Time protected", "Prototype method chosen", "Test users available"],
        watchouts: ["A sprint is not a general brainstorming workshop.", "Do not start without a testable challenge.", "Avoid trying to solve several unrelated problems at once."],
        outputs: ["Sprint target", "Selected solution", "Prototype", "User test evidence", "Next-step recommendation"],
      };

    case "Sprint Setup & Logistics Guide":
      return {
        summary: "Use this to prepare the sprint before people enter the room. Good setup prevents most sprint failures.",
        useWhen: ["1-2 weeks before the sprint", "When confirming the challenge", "When briefing stakeholders"],
        steps: [
          { title: "Define the challenge", detail: "Write a clear problem statement from the user’s perspective. Avoid phrasing it as a solution already chosen." },
          { title: "Confirm the Decider", detail: "Identify the person with authority to make final calls on the sprint target, selected concept, and next steps." },
          { title: "Invite the right team", detail: "Bring 5-7 people with knowledge of users, operations, policy, delivery, technology, constraints, and decision-making." },
          { title: "Book experts and users", detail: "Arrange expert interviews for Day 1 and recruit five representative users for Day 4 before the sprint begins." },
          { title: "Prepare the room and tools", detail: "Set up wall space, sticky notes, markers, timer, prototype tools, recording setup, and artefact capture." },
        ],
        facilitatorPrompts: ["What decision should this sprint help us make?", "Who must be in the room for this to be credible?", "What would make this sprint worth the time?"],
        checklist: ["Challenge agreed", "Decider confirmed", "Team invited", "Experts booked", "Users recruited", "Room/materials ready", "Prototype tools ready", "Calendar protected"],
        watchouts: ["Do not run a sprint without a real Decider.", "Avoid challenges that are too broad to prototype.", "Do not leave user recruitment until Day 4."],
        outputs: ["Sprint brief", "Team list", "Schedule", "Materials checklist", "Recruitment plan"],
      };

    case "Roles & Responsibilities":
      return {
        summary: "A clear role model keeps the sprint moving. Everyone contributes, but not everyone decides. The facilitator protects the process and the Decider protects momentum.",
        useWhen: ["Before Day 1", "When inviting participants", "When decision authority is unclear"],
        steps: [
          { title: "Facilitator", detail: "Runs the process, explains activities, manages time, encourages participation, captures outputs, and keeps the room focused." },
          { title: "Decider", detail: "Makes final calls when the team cannot agree. The Decider should be present for target selection, concept selection, and next steps." },
          { title: "Sprint team", detail: "Contributes expertise, works silently when asked, sketches ideas, votes honestly, and helps build or evaluate the prototype." },
          { title: "Experts", detail: "Join for short interviews to share knowledge about users, constraints, systems, operations, policy, or prior attempts." },
          { title: "Tester / note-taker", detail: "During user testing, one person interviews while another captures observations, quotes, behaviours, and evidence." },
        ],
        facilitatorPrompts: ["For this activity, who contributes and who decides?", "Are we asking for input or making a decision?", "Who owns the next step after this?"],
        checklist: ["Facilitator named", "Decider named", "Core team confirmed", "Experts scheduled", "Testing roles assigned", "Note-taker agreed"],
        watchouts: ["Consensus is not always the goal.", "Do not let stakeholders override user evidence without naming the trade-off.", "Avoid unclear ownership after decisions."],
        outputs: ["Role list", "Decision rights", "Testing roles", "Action owners"],
      };

    case "Sprint Facilitation Playbook":
      return {
        summary: "The live operating guide for running the sprint room. Use this as the facilitator’s anchor across all four days.",
        useWhen: ["Before every day starts", "When moving between activities", "When the room loses focus"],
        steps: [
          { title: "Set the contract", detail: "Start by explaining the goal, rules, role of the Decider, how timeboxes work, and how decisions will be made." },
          { title: "Keep the rhythm", detail: "Use short instructions, visible timeboxes, silent work, review moments, and clear transitions between activities." },
          { title: "Protect the process", detail: "Pause debates that are not helping, move off-topic items to the parking lot, and keep outputs visible." },
          { title: "Make work visible", detail: "Capture notes, votes, photos, sketches, decisions, and open questions as they happen rather than reconstructing later." },
          { title: "Close each loop", detail: "At the end of every activity, name the output, confirm what is carried forward, and record the evidence or decision." },
        ],
        facilitatorPrompts: [
          "Here is what we are doing, why it matters, and what we need by the end.",
          "Let’s work silently first so we get independent thinking.",
          "I’m going to park that because it matters, but it is not needed for this decision.",
          "Before we move on, what exactly are we carrying forward?",
        ],
        checklist: ["Challenge visible", "Timer visible", "Decider confirmed", "Parking lot visible", "Activity output named", "Artefacts captured", "Next step clear"],
        watchouts: ["Dominant voices can distort decisions.", "A weak challenge creates a weak sprint.", "Skipping capture makes the report impossible later.", "Long debates are usually a sign the decision frame is unclear."],
        outputs: ["Daily decisions", "Captured artefacts", "Running notes", "Sprint report evidence"],
      };

    case "Day Opening & Closing Scripts":
      return {
        summary: "Short scripts that reduce facilitator load and help each day feel structured, confident, and purposeful.",
        useWhen: ["At the start of each day", "After breaks", "At the end of each day"],
        steps: [
          { title: "Day 1 opening", detail: "Today we understand the challenge, hear from experts, turn problems into opportunities, and choose the target we will solve for." },
          { title: "Day 2 opening", detail: "Today we move from understanding to possible solutions. We will sketch individually, review silently, and choose one direction to prototype." },
          { title: "Day 3 opening", detail: "Today we build only what we need to learn. The prototype must feel real enough for users to react to, not complete enough to launch." },
          { title: "Day 4 opening", detail: "Today we test the prototype with users. We are looking for behaviour, confusion, value, evidence, and clear next steps." },
          { title: "Daily close", detail: "Summarise decisions, capture missing artefacts, name open questions, and preview what happens next." },
        ],
        facilitatorPrompts: [
          "Today’s job is not to solve everything. It is to produce the next useful sprint output.",
          "We are going to trust the process and keep moving.",
          "Before we finish, what have we decided and what still needs evidence?",
        ],
        checklist: ["Goal restated", "Agenda visible", "Working agreement repeated", "Outputs named", "Artefacts captured", "Tomorrow previewed"],
        watchouts: ["Long openings drain energy.", "Vague closes create confusion the next morning.", "Do not end without naming decisions."],
        outputs: ["Daily recap", "Decision list", "Captured artefacts", "Next-day focus"],
      };

    case "Transitions & Instructions Library":
      return {
        summary: "Use transition scripts to move the room between activities without over-explaining or losing momentum.",
        useWhen: ["Between activities", "When participants look unsure", "When you need to tighten the room"],
        steps: [
          { title: "Name the shift", detail: "Explain what the team has just completed and what they are moving into next." },
          { title: "Give the task", detail: "Say exactly what people should do, how long they have, and what format to use." },
          { title: "Show the output", detail: "Give a concrete example of what good output looks like before the timebox begins." },
          { title: "Start cleanly", detail: "Confirm the timer, materials, and working mode before beginning. Silent work means silent work." },
        ],
        facilitatorPrompts: ["We are moving from understanding to choosing.", "You have eight minutes. One idea per note.", "Good enough is better than perfect here.", "We are not debating yet; we are generating options."],
        checklist: ["Task clear", "Time clear", "Output clear", "Materials ready", "Capture method ready"],
        watchouts: ["Avoid long lectures.", "Do not assume everyone understands the output format.", "Repeat the timebox before starting.", "Do not allow discussion during silent work."],
        outputs: ["Cleaner activity outputs", "Less confusion", "Better timekeeping"],
      };

    case "Problem Mapping Facilitation Guide":
      return {
        summary: "Problem mapping helps the team build a shared picture of the user journey, pain points, constraints, and moments where the sprint could intervene.",
        useWhen: ["Day 1", "When the problem feels fuzzy", "Before generating HMW questions"],
        steps: [
          { title: "Choose the map frame", detail: "Map the user’s journey from trigger to outcome. Keep it user-facing rather than an internal process map." },
          { title: "Add steps", detail: "Ask the team to add the key moments the user goes through. Keep steps broad enough to see the whole journey." },
          { title: "Add pain points and questions", detail: "Capture where users struggle, where the service fails, and what the team does not yet know." },
          { title: "Mark high-risk moments", detail: "Identify points with high user pain, high uncertainty, business importance, or delivery risk." },
          { title: "Select a target area", detail: "Use discussion, voting, and Decider input to choose where the sprint should focus." },
        ],
        facilitatorPrompts: ["What does the user do before this?", "Where does the journey break down?", "What do we know versus assume?", "Where would a better experience make the biggest difference?"],
        checklist: ["User journey visible", "Pain points added", "Assumptions labelled", "Questions captured", "Target area selected", "Photo captured"],
        watchouts: ["Do not map internal teams instead of user experience.", "Avoid solving while mapping.", "Do not let the map become too detailed to use."],
        outputs: ["Journey map", "Pain points", "Assumptions", "Target area", "Problem map photo"],
      };

    case "Expert Interview Guide":
      return {
        summary: "Expert interviews bring important context into the room quickly. They help the team understand users, constraints, prior attempts, risks, and hidden knowledge.",
        useWhen: ["Day 1", "When the team lacks context", "When assumptions need surfacing"],
        steps: [
          { title: "Brief the expert", detail: "Explain the sprint challenge and ask them to focus on facts, patterns, constraints, and user evidence." },
          { title: "Ask open questions", detail: "Use questions that reveal behaviour, pain, constraints, previous solutions, and known risks." },
          { title: "Capture HMWs silently", detail: "As the expert speaks, the sprint team writes How Might We notes and observations individually." },
          { title: "Clarify signals", detail: "Ask follow-up questions where there is strong evidence, contradiction, or uncertainty." },
          { title: "Thank and summarise", detail: "Confirm the key points heard and capture any open questions for later." },
        ],
        facilitatorPrompts: ["What have users struggled with most?", "What has already been tried?", "What constraints must we respect?", "What would you warn this team not to miss?"],
        checklist: ["Experts booked", "Questions prepared", "Timer set", "HMW notes captured", "Key quotes noted", "Open questions saved"],
        watchouts: ["Do not let experts present for too long.", "Avoid asking for solutions only.", "Do not treat one expert opinion as user evidence."],
        outputs: ["Expert insights", "HMW notes", "Constraints", "Risks", "Open questions"],
      };

    case "How Might We Workshop Guide":
      return {
        summary: "How Might We questions turn problems and insights into opportunity statements. They create a bridge between understanding the problem and generating solutions.",
        useWhen: ["After mapping", "During expert interviews", "Before choosing the sprint target"],
        steps: [
          { title: "Explain the format", detail: "Every note should start with ‘How might we…’ and describe an opportunity without embedding a specific solution." },
          { title: "Generate individually", detail: "Participants write one HMW per note. Quantity matters first; quality comes later." },
          { title: "Share and cluster", detail: "Place HMWs on the wall, group similar opportunities, and give clusters simple labels." },
          { title: "Vote", detail: "Use dots to identify the HMWs that feel most important, promising, or risky." },
          { title: "Choose a target", detail: "Use the votes as input, then let the Decider choose the area that will drive the rest of the sprint." },
        ],
        facilitatorPrompts: ["Can this be answered in more than one way?", "Is this framed around the user?", "Does this avoid assuming the solution?", "Is this specific enough to guide sketching?"],
        checklist: ["One idea per note", "No hidden solutions", "User-centred wording", "Clusters created", "Votes captured", "Target selected"],
        watchouts: ["HMWs that are too broad do not guide action.", "HMWs that contain solutions narrow thinking too early.", "Do not skip clustering before voting."],
        outputs: ["HMW wall", "Opportunity clusters", "Votes", "Selected target"],
      };

    case "Lightning Demos & Sketching Guide":
      return {
        summary: "Lightning demos and sketching help the team move from problem understanding to solution possibilities while protecting independent thinking.",
        useWhen: ["Day 2", "Before solution sketching", "When the team needs inspiration"],
        steps: [
          { title: "Run lightning demos", detail: "Each person shares examples from inside or outside the sector. Focus on useful patterns, not copying whole products." },
          { title: "Capture ingredients", detail: "Write down reusable ideas, interaction patterns, content approaches, service moments, or decision mechanisms." },
          { title: "Four-step sketch", detail: "Move through notes, ideas, Crazy 8s, and a final solution sketch. Keep work individual and mostly silent." },
          { title: "Make sketches self-explanatory", detail: "Each sketch should include a title, key steps, annotations, and enough detail to be understood without a pitch." },
        ],
        facilitatorPrompts: ["What pattern is useful here?", "How could this inspire our challenge?", "Show the user flow, not just screens.", "Make it understandable without explanation."],
        checklist: ["Examples gathered", "Useful patterns captured", "Silent sketching protected", "Crazy 8s completed", "Solution sketches finished"],
        watchouts: ["Do not let people pitch ideas during sketching.", "Do not judge drawing quality.", "Avoid copying an example without adapting it to the user need."],
        outputs: ["Lightning demo notes", "Idea ingredients", "Crazy 8s", "Solution sketches"],
      };

    case "Voting & Decision Framework":
      return {
        summary: "Voting helps the team reveal signal quickly, but the Decider keeps momentum by making the final call. Use voting as input, not as a substitute for decision-making.",
        useWhen: ["Target selection", "Sketch selection", "Prioritising opportunities", "Choosing next steps"],
        steps: [
          { title: "Set criteria", detail: "Explain what people are voting for: user value, feasibility, evidence, risk, or strategic fit." },
          { title: "Review silently", detail: "Give people time to inspect options without discussion so they are not swayed too early." },
          { title: "Dot vote", detail: "Participants place votes on the strongest options. Encourage voting for substance, not polish." },
          { title: "Discuss signal", detail: "Review where votes cluster, but also ask what risks or assumptions remain." },
          { title: "Supervote", detail: "The Decider makes the final selection and briefly explains the rationale." },
        ],
        facilitatorPrompts: ["Vote for the idea you would most want to test.", "What risk would this help us learn about?", "Where is there strong signal?", "Decider, what are we carrying forward?"],
        checklist: ["Criteria named", "Silent review done", "Votes captured", "Rationale captured", "Final choice made", "Artefact photographed"],
        watchouts: ["Dot voting can reward popularity or polish.", "Do not force consensus.", "Do not ignore a Decider concern simply because votes clustered elsewhere."],
        outputs: ["Voting board", "Decision rationale", "Selected target or concept", "Risks to test"],
      };

    case "Prototyping Guide":
      return {
        summary: "A sprint prototype should be realistic enough to generate valid user reactions, but lightweight enough to build in a day. Build the illusion of the experience, not the full system.",
        useWhen: ["Day 3", "After selecting a concept", "Before user testing"],
        steps: [
          { title: "Define the critical path", detail: "Identify the smallest flow users must experience to test the sprint question." },
          { title: "Choose fidelity", detail: "Use slides, Figma, paper, clickable mockups, forms, or staged service materials depending on what needs to feel real." },
          { title: "Assign roles", detail: "Common roles include maker, writer, stitcher, asset collector, interviewer, and reviewer." },
          { title: "Use realistic content", detail: "Replace lorem ipsum with plausible wording, data, names, scenarios, and constraints." },
          { title: "Review before testing", detail: "Run through the prototype as a user and fix anything that blocks the test scenario." },
        ],
        facilitatorPrompts: ["What do users need to believe is real?", "What can we fake safely?", "What is the critical path?", "What question will this prototype help answer?"],
        checklist: ["Storyboard agreed", "Roles assigned", "Critical path built", "Realistic content added", "Prototype rehearsed", "Testing script aligned"],
        watchouts: ["Do not build the entire product.", "Do not spend the day perfecting visual details.", "Avoid features that are not needed for the test question."],
        outputs: ["Storyboard", "Prototype plan", "Testable prototype", "Testing script inputs"],
      };

    case "User Testing Guide":
      return {
        summary: "User testing in a sprint is designed to reveal behaviour, comprehension, value, and risk. The goal is learning, not proving that the prototype is right.",
        useWhen: ["Day 4", "When prototype is ready", "When evidence is needed for next steps"],
        steps: [
          { title: "Prepare the session", detail: "Set up the prototype, script, note-taking, recording if appropriate, consent, and scenario." },
          { title: "Start neutrally", detail: "Make it clear you are testing the prototype, not the participant. Encourage honest reactions." },
          { title: "Give realistic tasks", detail: "Ask users to complete tasks or respond to scenarios rather than asking whether they like the idea." },
          { title: "Observe behaviour", detail: "Capture what users do, where they hesitate, what they misunderstand, and what they value." },
          { title: "Debrief immediately", detail: "After each session, capture key observations, quotes, signals, and questions before the next user." },
        ],
        facilitatorPrompts: ["What would you do first?", "What are you expecting to happen?", "What are you thinking as you look at this?", "What would make this more useful?"],
        checklist: ["Users scheduled", "Script ready", "Prototype ready", "Consent handled", "Note-taker assigned", "Debriefs completed", "Patterns reviewed"],
        watchouts: ["Do not lead the user.", "Do not explain the prototype too much.", "Do not treat polite praise as validation.", "Watch behaviour more than opinion."],
        outputs: ["Testing notes", "User quotes", "Behavioural observations", "Validated and invalidated assumptions", "Next-step recommendations"],
      };

    case "Room Dynamics & Participation":
      return {
        summary: "Good facilitation makes participation balanced, safe, and useful. The process should prevent hierarchy, confidence, or personality from dominating the sprint output.",
        useWhen: ["All days", "When voices are uneven", "When groupthink appears"],
        steps: [
          { title: "Set working agreements", detail: "Explain silent work, one conversation at a time, timeboxing, user focus, and parking lot rules." },
          { title: "Use silent generation", detail: "Ask people to write or sketch before discussion so quieter participants contribute equally." },
          { title: "Invite quieter voices", detail: "Use structured rounds, written input, or direct but low-pressure invitations to contribute." },
          { title: "Contain dominant voices", detail: "Acknowledge useful input, then redirect to the activity, timebox, or Decider." },
        ],
        facilitatorPrompts: ["Let’s get ideas down silently first.", "I want to hear from someone who has not spoken yet.", "Let’s hold that and return after the vote.", "What would the user say here?"],
        checklist: ["Working agreements visible", "Silent work used", "Equal contribution encouraged", "Dominance managed", "Parking lot used"],
        watchouts: ["Expertise can accidentally silence users or frontline perspectives.", "The loudest view is not always the strongest evidence.", "Do not let humour undermine psychological safety."],
        outputs: ["Balanced inputs", "Parking lot notes", "Clearer decisions", "Safer participation"],
      };

    case "Energy, Pacing & Timeboxing":
      return {
        summary: "Timeboxing creates momentum and prevents the sprint becoming a normal meeting. The facilitator’s job is to make time visible and protect energy.",
        useWhen: ["All days", "When activities are overrunning", "When energy drops"],
        steps: [
          { title: "State the timebox", detail: "Tell the team exactly how long they have and what output is needed before the timer starts." },
          { title: "Make time visible", detail: "Use a visible timer and give warnings at sensible points: halfway, five minutes, one minute." },
          { title: "Prefer smaller loops", detail: "Break long activities into shorter rounds with quick captures and reviews." },
          { title: "Recover deliberately", detail: "If time slips, reduce scope, defer discussion, or ask the Decider for a trade-off." },
        ],
        facilitatorPrompts: ["You have five minutes left; focus on the output.", "We are going to move on and capture this as a risk.", "Good enough is enough for this stage.", "Which part of this matters most to finish?"],
        checklist: ["Timer visible", "Warnings given", "Breaks protected", "Scope reduced when needed", "Decider used for trade-offs"],
        watchouts: ["Overruns compound quickly.", "Skipping breaks usually reduces quality later.", "Do not let perfectionism consume prototype time."],
        outputs: ["Completed activities", "Captured trade-offs", "More predictable sprint flow"],
      };

    case "Handling Conflict & Disagreement":
      return {
        summary: "Disagreement is useful when it reveals assumptions, risks, or competing priorities. The facilitator should structure disagreement rather than suppress it.",
        useWhen: ["When debate gets circular", "When stakeholders disagree", "When the Decider hesitates"],
        steps: [
          { title: "Name the disagreement", detail: "State the decision or assumption that people are disagreeing about in neutral language." },
          { title: "Separate evidence from opinion", detail: "Ask what is known, what is assumed, and what could be tested." },
          { title: "Use a decision mechanism", detail: "Apply voting, Decider call, risk capture, or a test question to move forward." },
          { title: "Capture the trade-off", detail: "Record what was chosen, what was deferred, and what concern remains." },
        ],
        facilitatorPrompts: ["What are we actually deciding?", "What evidence supports that?", "Can this become something we test?", "Decider, what direction should we take for now?"],
        checklist: ["Issue named", "Evidence separated", "Decision route chosen", "Trade-off captured", "Sprint continues"],
        watchouts: ["Do not aim for consensus at every point.", "Do not let disagreement become personal.", "Do not bury risks to keep the room comfortable."],
        outputs: ["Decision", "Risk note", "Testable assumption", "Parking lot item"],
      };

    case "Artefact Capture Guide":
      return {
        summary: "How to capture physical sprint-wall work so the app becomes the source of truth for the sprint report.",
        useWhen: ["After every activity", "Before removing notes from a wall", "When key decisions are made"],
        steps: [
          { title: "Capture immediately", detail: "Take photos while the room context is still fresh. Do not wait until the end of the day." },
          { title: "Name the artefact", detail: "Give each artefact a title that makes sense later, such as Problem Map, HMW Cluster, Voting Board, or Storyboard." },
          { title: "Theme notes", detail: "Use note types such as Insight, Opportunity, Parking lot, Decision, Risk, and Question to make evidence scannable." },
          { title: "Add context", detail: "Add a caption explaining what the artefact shows, why it matters, and what decision or evidence it supports." },
          { title: "Check report usefulness", detail: "Ask whether a stakeholder could understand the artefact without being in the room." },
        ],
        facilitatorPrompts: ["What should this artefact be called in the report?", "Is this an insight, opportunity, decision, risk, or question?", "What context would someone need later?"],
        checklist: ["Photo uploaded", "Title added", "Caption added", "Note type selected", "Linked to correct activity", "Decision or evidence clear"],
        watchouts: ["Untitled photos become useless later.", "Do not capture only the final output; capture important intermediate decisions too.", "Avoid mixing decisions and questions in one note."],
        outputs: ["Photo evidence", "Themed notes", "Report-ready artefacts"],
      };

    case "Synthesis & Insight Capture":
      return {
        summary: "Turn messy notes and artefacts into clear patterns, evidence, and decisions the team can act on.",
        useWhen: ["After interviews", "After testing", "At the end of Day 4", "Before writing the report"],
        steps: [
          { title: "Group similar items", detail: "Cluster notes by theme, behaviour, pain point, user need, risk, or opportunity." },
          { title: "Separate evidence from interpretation", detail: "Mark what users did or said separately from what the team thinks it means." },
          { title: "Name the pattern", detail: "Write a short insight statement that explains the meaning of the cluster." },
          { title: "Assess confidence", detail: "Distinguish strong repeated evidence from weaker signals or assumptions." },
          { title: "Connect to action", detail: "Turn each important pattern into a decision, risk, design change, or next step." },
        ],
        facilitatorPrompts: ["What pattern keeps repeating?", "What did users actually do?", "How confident are we?", "What decision does this evidence support?"],
        checklist: ["Themes grouped", "Evidence labelled", "Insights named", "Confidence assessed", "Risks captured", "Next steps agreed"],
        watchouts: ["Do not over-weight one loud quote.", "Avoid turning every observation into a feature request.", "Keep weak evidence labelled as weak."],
        outputs: ["Insight themes", "Evidence summary", "Decisions", "Next-step recommendations"],
      };

    case "Sprint Report & Next Steps":
      return {
        summary: "The sprint report should explain what was tested, what was learned, what evidence supports the conclusion, and what should happen next.",
        useWhen: ["After Day 4", "When briefing stakeholders", "Before moving into delivery or another discovery cycle"],
        steps: [
          { title: "Summarise the challenge", detail: "Restate the user problem, target users, desired outcome, and sprint focus." },
          { title: "Show the journey", detail: "Include key artefacts: map, HMWs, sketches, voting outputs, storyboard, prototype, and testing evidence." },
          { title: "Explain what was tested", detail: "Describe the prototype, testing approach, users involved, and tasks or scenarios." },
          { title: "Present findings", detail: "Group findings into validated signals, warning signs, unanswered questions, and opportunities." },
          { title: "Recommend next steps", detail: "State whether to proceed, iterate, stop, research further, or run another sprint." },
        ],
        facilitatorPrompts: ["What decision does this report need to support?", "What evidence is strongest?", "What should stakeholders do next?", "What remains uncertain?"],
        checklist: ["Challenge included", "Target users included", "Prototype described", "Artefacts included", "Testing evidence summarised", "Recommendation clear"],
        watchouts: ["Do not make the report a diary of everything that happened.", "Do not hide uncertainty.", "Avoid recommendations that are not supported by evidence."],
        outputs: ["Sprint report", "Decision recommendation", "Evidence pack", "Next-step plan"],
      };

    case "What If Things Go Wrong?":
      return {
        summary: "A practical troubleshooting guide for common sprint failure modes and how to recover without derailing the room.",
        useWhen: ["The room is stuck", "The team disagrees", "Time is slipping", "The evidence is unclear"],
        steps: [
          { title: "Pause and name it", detail: "Briefly state what is happening without blame: time, uncertainty, disagreement, lack of evidence, or unclear decision." },
          { title: "Choose a recovery move", detail: "Use a timebox, Decider call, parking lot, silent vote, narrowed question, or reduced scope to restore momentum." },
          { title: "Capture the trade-off", detail: "Record what was decided, what was deferred, what risk remains, and who owns the next action." },
          { title: "Restart the room", detail: "Restate the current objective and move immediately into the next small action." },
        ],
        facilitatorPrompts: ["I’m noticing we are circling. What decision is actually needed?", "Let’s separate evidence from opinion.", "This is important, so I’m parking it rather than losing it.", "What is the smallest useful next step?"],
        checklist: ["Issue named", "Recovery move chosen", "Decider involved if needed", "Risk captured", "Next action clear", "Sprint continues"],
        watchouts: ["Do not let unresolved tension sit unspoken.", "Do not debate every point to consensus.", "Do not sacrifice testing time unless absolutely necessary."],
        outputs: ["Recovery decision", "Parking lot item", "Risk note", "Next action"],
      };

    case "Remote & Hybrid Sprint Adjustments":
      return {
        summary: "Remote and hybrid sprints need more explicit facilitation, clearer artefact capture, shorter instructions, and stronger participation design.",
        useWhen: ["Remote sprint", "Hybrid workshop", "Distributed team", "Digital whiteboard environment"],
        steps: [
          { title: "Reduce ambiguity", detail: "Share links, agenda, working norms, and tool instructions before the session." },
          { title: "Design participation", detail: "Use silent digital work, chat input, structured rounds, and explicit turn-taking to avoid remote voices being lost." },
          { title: "Shorten activity loops", detail: "Remote fatigue is real. Use shorter bursts, more visible timers, and more frequent check-ins." },
          { title: "Capture digitally", detail: "Use screenshots, exported boards, named artefacts, and notes attached to the correct activity." },
          { title: "Protect decisions", detail: "Make voting and Decider calls very explicit so hybrid ambiguity does not slow progress." },
        ],
        facilitatorPrompts: ["Please add your notes silently to the board.", "Remote participants first on this round.", "I’m going to summarise what I’m seeing before we vote.", "Decider, please confirm the direction."],
        checklist: ["Links shared", "Tools tested", "Timer visible", "Remote participation plan", "Board/export capture", "Backup communication channel"],
        watchouts: ["Hybrid rooms often privilege people physically present.", "Tool friction can consume sprint time.", "Do not assume silence means agreement."],
        outputs: ["Digital board", "Screenshots", "Remote participation notes", "Decision record"],
      };

    default:
      return {
        summary: guide.description,
        useWhen: [guide.stage, guide.audience, guide.time],
        steps: [
          { title: "Frame the purpose", detail: "Explain why this matters, what the team will do, and what output should exist by the end." },
          { title: "Run the method", detail: "Use a clear timebox, keep instructions visible, and capture the output as the activity happens." },
          { title: "Make the output useful", detail: "Name the decision, evidence, or artefact created so it can be reused in the report." },
        ],
        facilitatorPrompts: ["What are we trying to learn or decide here?", "What evidence do we have, and what is still an assumption?", "What should we capture before we move on?"],
        checklist: ["Clear objective", "Visible timebox", "Named owner", "Captured artefacts", "Next step agreed"],
        watchouts: ["Do not let discussion replace capture.", "Avoid solving before the problem is understood.", "Keep the Decider involved at decision points."],
        outputs: ["Notes", "Artefacts", "Decision or next step"],
      };
  }
}

type AppState = {
  currentDay: DayId;
  sprintName: string;
  challenge: string;
  targetUsers: string;
  desiredOutcome: string;
  completed: string[];
  notes: Record<string, string>;
  artefacts: Record<string, Artefact[]>;
  hmws: string[];
  runningActivityId?: string;
};

type Action =
  | { type: "nav/setDay"; dayId: DayId }
  | { type: "setup/update"; field: "sprintName" | "challenge" | "targetUsers" | "desiredOutcome"; value: string }
  | { type: "activity/run"; key: string }
  | { type: "activity/stop" }
  | { type: "activity/toggleComplete"; key: string }
  | { type: "notes/set"; key: string; value: string }
  | { type: "artefact/add"; key: string; artefact: Artefact }
  | { type: "artefact/remove"; key: string; artefactId: string }
  | { type: "artefact/updateName"; key: string; artefactId: string; name: string }
  | { type: "artefact/updateCaption"; key: string; artefactId: string; caption: string }
  | { type: "artefact/updateNoteKind"; key: string; artefactId: string; noteKind: Artefact["noteKind"] }
  | { type: "hmw/addMany"; questions: string[]; writeToDay1HmwNotes?: boolean };

const initialState: AppState = {
  currentDay: "day1",
  sprintName: "Design Sprint Facilitator",
  challenge: "Users struggle to find the right place to report things on our website and end up sending the wrong forms or the right forms to the wrong place.",
  targetUsers: "Aberdeen City Council residents",
  desiredOutcome: "A testable prototype",
  completed: [],
  notes: {},
  artefacts: {},
  hmws: [],
  runningActivityId: undefined,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "nav/setDay": {
      return { ...state, currentDay: action.dayId };
    }
    case "setup/update": {
      return { ...state, [action.field]: action.value };
    }
    case "activity/run": {
      return { ...state, runningActivityId: action.key };
    }
    case "activity/stop": {
      return { ...state, runningActivityId: undefined };
    }
    case "activity/toggleComplete": {
      const isDone = state.completed.includes(action.key);
      const completed = isDone ? state.completed.filter((k) => k !== action.key) : [...state.completed, action.key];
      const runningActivityId = state.runningActivityId === action.key && !isDone ? undefined : state.runningActivityId;
      return { ...state, completed, runningActivityId };
    }
    case "notes/set": {
      return { ...state, notes: { ...state.notes, [action.key]: action.value } };
    }
    case "artefact/add": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: [...(state.artefacts[action.key] ?? []), action.artefact],
        },
      };
    }
    case "artefact/remove": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).filter((artefact) => artefact.id !== action.artefactId),
        },
      };
    }
    case "artefact/updateName": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).map((artefact) =>
            artefact.id === action.artefactId ? { ...artefact, name: action.name } : artefact,
          ),
        },
      };
    }
    case "artefact/updateCaption": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).map((artefact) =>
            artefact.id === action.artefactId ? { ...artefact, caption: action.caption } : artefact,
          ),
        },
      };
    }
    case "artefact/updateNoteKind": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).map((artefact) =>
            artefact.id === action.artefactId ? { ...artefact, noteKind: action.noteKind } : artefact,
          ),
        },
      };
    }
    case "hmw/addMany": {
      const uniqueHmws = [...new Set([...state.hmws, ...action.questions])];
      const next: AppState = { ...state, hmws: uniqueHmws };

      if (action.writeToDay1HmwNotes) {
        const key = activityKey("day1", "hmw");
        const existing = next.notes[key]?.trim();
        const block =
          "How Might We (generated)\n" +
          action.questions.map((q) => `- ${q}`).join("\n") +
          (existing ? `\n\n---\n\n${existing}` : "");
        next.notes = { ...next.notes, [key]: block };
      }

      return next;
    }
    default: {
      return state;
    }
  }
}

function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#070617] text-white hover:bg-slate-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]", className)}>
      {children}
    </section>
  );
}

function DarkPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-white/10 bg-[#05060f] text-white shadow-xl", className)}>
      {children}
    </section>
  );
}

function Header({
  page,
  onNavigate,
  currentDay,
  sprintName,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  currentDay: DayId;
  sprintName: string;
}) {
  const items = [
    { id: "dashboard" as const, label: "Dashboard", icon: Home },
    ...sprintDays.map((d) => ({ id: d.id as Page, label: d.label, icon: d.icon, colour: d.colour })),
    { id: "report" as const, label: "Report", icon: Star },
    { id: "timer" as const, label: "Timer", icon: Clock },
    { id: "resources" as const, label: "Resources", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
        <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#070617] text-xs font-black text-white">
            DS
          </span>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-black leading-5">Sprintpilot</div>
            <div className="text-xs font-semibold text-slate-500">{sprintName || "Design Sprint"}</div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {items.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            const c = "colour" in item && item.colour ? colour[item.colour] : undefined;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                  active ? "bg-[#070617] text-white" : "text-slate-700 hover:bg-slate-100",
                  active && c?.solid,
                )}
              >
                <Icon className={cx("h-4 w-4", !active && c?.text)} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border px-3 py-1 text-xs font-bold">Sprint Day {currentDay.replace("day", "")}/4</span>
          <Button variant="secondary" className="hidden px-3 py-1.5 sm:flex">
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </div>
      </div>
    </header>
  );
}

function Dashboard({
  state,
  dispatch,
  onNavigate,
  openHmw,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
  openHmw: () => void;
}) {
  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const day of sprintDays) {
      for (const a of day.activities) keys.push(activityKey(day.id, a.id));
    }
    return keys;
  }, []);

  const progress = useMemo(() => {
    const progressed = allKeys.filter(
      (k) =>
        state.completed.includes(k) ||
        state.runningActivityId === k ||
        (state.notes[k] ?? "").trim().length > 0 ||
        (state.artefacts[k] ?? []).length > 0,
    );
    const total = allKeys.length;
    const count = progressed.length;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { total, count, pct };
  }, [allKeys, state.completed, state.notes, state.artefacts, state.runningActivityId]);

  const activeActivity = useMemo(() => {
    if (!state.runningActivityId) return null;
    for (const day of sprintDays) {
      const activity = day.activities.find((a) => activityKey(day.id, a.id) === state.runningActivityId);
      if (activity) return { day, activity };
    }
    return null;
  }, [state.runningActivityId]);

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">{state.sprintName || "Design Sprint Facilitator"}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          A facilitator-friendly 4-day design sprint workspace. Run activities, capture notes, generate HMWs, and ship a report.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <DarkPanel className="border-0 p-6 shadow-2xl ring-1 ring-slate-900/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <BookOpen className="h-5 w-5" /> Sprint Overview
              </h2>
              <p className="mt-1 text-sm text-white/70">Progress counts activities you’ve completed or captured notes for.</p>
            </div>
            <Button variant="secondary" className="border-white/10 !bg-white/10 !text-white hover:!bg-white/15" onClick={() => onNavigate("report")}>
              <Eye className="h-4 w-4" /> View report
            </Button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4" /> 4 Days Total
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" /> 5-7 Participants
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4" /> Validate a Solution
            </div>
          </div>

          <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-white/60">Challenge</div>
              <div className="mt-1 text-sm text-white/80">{state.challenge || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-white/60">Target users</div>
              <div className="mt-1 text-sm text-white/80">{state.targetUsers || "—"}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-black uppercase tracking-wide text-white/60">Desired outcome</div>
              <div className="mt-1 text-sm text-white/80">{state.desiredOutcome || "—"}</div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
            <span>Sprint Progress</span>
            <span>
              {progress.pct}% ({progress.count}/{progress.total})
            </span>
          </div>
          {activeActivity ? (
            <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-200">Active activity</div>
              <div className="mt-1 font-black">{activeActivity.day.label}: {activeActivity.activity.title}</div>
              <div className="mt-1 text-emerald-100">{activeActivity.activity.description}</div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              No activity is running. Open a day and choose <strong className="text-white">Run Activity</strong> to move the sprint forward.
            </div>
          )}
          <div className="mt-4">
            <div className="relative h-4 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
              <div
                className="h-4 rounded-full transition-[width] duration-500"
                style={sprintProgressFillStyle(progress.pct)}
              />
              <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-4 text-[11px] font-bold text-white/60">
              <span>Day 1</span>
              <span className="text-center">Day 2</span>
              <span className="text-center">Day 3</span>
              <span className="text-right">Day 4</span>
            </div>
          </div>
        </DarkPanel>

        <SprintSetupPanel state={state} dispatch={dispatch} onNavigate={onNavigate} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {sprintDays.map((day) => (
          <DayCard key={day.id} day={day} currentDay={state.currentDay} runningActivityId={state.runningActivityId} completed={state.completed} onNavigate={onNavigate} />
        ))}
      </div>

      <QuickActions onNavigate={onNavigate} openHmw={openHmw} hmwCount={state.hmws.length} />
    </main>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-black">{label}</span>
        {hint ? <span className="text-xs font-semibold text-slate-500">{hint}</span> : null}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function SprintSetupPanel({
  state,
  dispatch,
  onNavigate,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
}) {
  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Sprint Setup</h2>
          <p className="mt-1 text-sm text-slate-500">These fields power your dashboard and report.</p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate("report")}>
          <Eye className="h-4 w-4" /> Report
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        <Field
          label="Sprint name"
          hint="Visible in the header"
          value={state.sprintName}
          onChange={(value) => dispatch({ type: "setup/update", field: "sprintName", value })}
          placeholder="e.g. Onboarding Sprint"
        />
        <Field
          label="Challenge"
          hint="What are we solving?"
          value={state.challenge}
          onChange={(value) => dispatch({ type: "setup/update", field: "challenge", value })}
          placeholder="e.g. Users drop off after step 2"
          textarea
        />
        <Field
          label="Target users"
          hint="Who are we solving for?"
          value={state.targetUsers}
          onChange={(value) => dispatch({ type: "setup/update", field: "targetUsers", value })}
          placeholder="e.g. Busy parents, new PMs..."
        />
        <Field
          label="Desired outcome"
          hint="Success criteria"
          value={state.desiredOutcome}
          onChange={(value) => dispatch({ type: "setup/update", field: "desiredOutcome", value })}
          placeholder="e.g. A testable prototype + learning"
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current day</div>
          <div className="mt-1 text-sm font-semibold">{dayLabel(state.currentDay)}</div>
        </div>
        <Button variant="secondary" onClick={() => onNavigate(state.currentDay)}>
          <Play className="h-4 w-4" /> Continue
        </Button>
      </div>
    </Panel>
  );
}

function DayCard({ day, currentDay, runningActivityId, completed, onNavigate }: { day: SprintDay; currentDay: DayId; runningActivityId?: string; completed: string[]; onNavigate: (page: Page) => void }) {
  const Icon = day.icon;
  const c = colour[day.colour];
  const active = currentDay === day.id;
  const activeActivity = day.activities.find((activity) => activityKey(day.id, activity.id) === runningActivityId);
  const completedCount = day.activities.filter((activity) => completed.includes(activityKey(day.id, activity.id))).length;

  return (
    <Panel className={cx("p-5", active && "border-2 border-slate-950", activeActivity && "ring-4 ring-emerald-100")}>
      <div className="flex items-start gap-4">
        <div className={cx("rounded-xl p-3", c.solid)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black">{day.title}</h2>
            {active ? <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">In progress</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{day.duration}</p>
        </div>
      </div>

      <p className="mt-7 text-sm leading-6 text-slate-700">{day.subtitle}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{completedCount}/{day.activities.length} complete</span>
        {activeActivity ? <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Running: {activeActivity.title}</span> : null}
      </div>

      <p className="mt-5 text-sm font-black">Key Activities</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {day.activities.slice(0, 4).map((a) => (
          <span key={a.id} className="rounded-md border px-2 py-1 text-xs font-semibold">
            {a.title}
          </span>
        ))}
      </div>

      <Button className="mt-5 w-full" variant={active ? "primary" : "secondary"} onClick={() => onNavigate(day.id)}>
        {active ? "Continue" : "Start"} {day.label}
      </Button>
    </Panel>
  );
}

function QuickActions({
  onNavigate,
  openHmw,
  hmwCount,
}: {
  onNavigate: (page: Page) => void;
  openHmw: () => void;
  hmwCount: number;
}) {
  const actions = [
    ["Saved HMW Questions", hmwCount > 0 ? `${hmwCount} saved` : "No saved questions yet", CheckCircle2, openHmw],
    ["Template Library", "Access worksheets and templates", BookOpen, () => onNavigate("resources")],
    ["Timer & Tools", "Time-boxing utilities", Timer, () => onNavigate("timer")],
    ["Sprint Report", "Summarize sprint data", Star, () => onNavigate("report")],
  ] as const;

  return (
    <Panel className="mt-6 p-5">
      <h2 className="text-lg font-black">Quick Actions</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {actions.map(([title, desc, Icon, action]) => (
          <button key={title} onClick={action} className="rounded-xl border p-4 text-left hover:bg-slate-50">
            <Icon className="mb-3 h-4 w-4 text-slate-600" />
            <strong className="block text-sm">{title}</strong>
            <span className="mt-1 block text-sm text-slate-500">{desc}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function DayPage({
  day,
  state,
  dispatch,
  onNavigate,
  openHmw,
}: {
  day: SprintDay;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
  openHmw: () => void;
}) {
  const [tab, setTab] = useState<Tab>("schedule");
  const c = colour[day.colour];
  const Icon = day.icon;
  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <Button variant="secondary" onClick={() => onNavigate("dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{day.title}</h1>
            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">In progress</span>
          </div>
          <p className="mt-1 text-lg text-slate-500">{day.subtitle}</p>
        </div>
        <span className="w-fit rounded-lg border px-3 py-2 text-sm font-bold">{day.duration}</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric icon={Icon} label="Goal" value={day.goal} tone={c.text} />
        <Metric icon={Users} label={day.middleLabel} value={day.middle} tone="text-emerald-600" />
        <Metric icon={CheckCircle2} label="Outcome" value={day.outcome} tone="text-orange-600" />
      </div>

      <div className="mt-6 grid grid-cols-4 rounded-2xl bg-slate-100 p-1">
        {(["schedule", "activities", "guide", "resources"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "rounded-xl py-2 text-sm font-black capitalize text-slate-700",
              tab === t && "bg-white text-slate-950 shadow-sm",
            )}
          >
            {t === "guide" ? day.guideLabel : t}
          </button>
        ))}
      </div>

      {tab === "schedule" ? <Schedule day={day} /> : null}
      {tab === "activities" ? <Activities day={day} state={state} dispatch={dispatch} openHmw={openHmw} /> : null}
      {tab === "guide" ? <Guide day={day} /> : null}
      {tab === "resources" ? <DayResources day={day} openHmw={openHmw} /> : null}

      <QuickActions onNavigate={onNavigate} openHmw={openHmw} hmwCount={state.hmws.length} />
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Icon className={cx("h-4 w-4", tone)} />
        <strong>{label}</strong>
      </div>
      <p className="mt-2 text-slate-500">{value}</p>
    </Panel>
  );
}

function Schedule({ day }: { day: SprintDay }) {
  const c = colour[day.colour];
  return (
    <Panel className="mt-3 p-5">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <Clock className="h-5 w-5" /> {day.label} Schedule
      </h2>
      <div className="mt-6 space-y-3">
        {day.schedule.map((item) => (
          <div
            key={`${item.time}-${item.title}`}
            className={cx(
              "flex items-center justify-between gap-3 rounded-xl border p-3",
              item.isBreak ? c.soft : "border-slate-200 bg-white",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-lg border bg-white px-2 py-1 text-xs font-black text-slate-800">{item.time}</span>
              <strong className="truncate text-sm">{item.title}</strong>
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-500">{item.duration}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Activities({
  day,
  state,
  dispatch,
  openHmw,
}: {
  day: SprintDay;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  openHmw: () => void;
}) {
  const c = colour[day.colour];
  const [selectedGuide, setSelectedGuide] = useState<ResourceGuide | null>(null);

  return (
    <div className="mt-3 space-y-4">
      {day.activities.map((a, index) => {
        const key = activityKey(day.id, a.id);
        const isRunning = state.runningActivityId === key;
        const isDone = state.completed.includes(key);
        const notes = state.notes[key] ?? "";
        const artefacts = state.artefacts[key] ?? [];
        const guide = getGuideByTitle(a.guideTitle);

        return (
          <Panel
            key={key}
            className={cx(
              "p-5 transition",
              isRunning && "border-2 border-emerald-500 bg-emerald-50/40 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]",
              isDone && !isRunning && "bg-slate-50",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-black">
                <span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs", c.solid)}>{index + 1}</span>
                {a.title}
              </h2>

              <div className="flex items-center gap-2">
                {isRunning ? <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Running now</span> : null}
                {isDone ? <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-black text-white">Completed</span> : null}
              </div>
            </div>

            <p className="mt-7 text-base leading-7 text-slate-700">{a.description}</p>

            <div className="mt-5 grid gap-10 md:grid-cols-2">
              <div>
                <strong className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Participants
                </strong>
                <p className="mt-2 text-sm text-slate-500">{a.participants}</p>
              </div>
              <div>
                <strong>Materials Needed</strong>
                <ul className="mt-2 list-inside list-disc text-sm leading-6 text-slate-500">
                  {a.materials.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-7 grid gap-8 md:grid-cols-2">
              <div>
                <strong>Deliverable</strong>
                <p className="mt-2 text-sm text-slate-500">{a.deliverable}</p>
              </div>
              <div>
                <strong>Facilitator Tips</strong>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-500">
                  {a.tips.map((tip) => (
                    <li key={tip}>💡 {tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-xl border bg-slate-50 p-3">
              <label htmlFor={`${key}-notes`} className="text-sm font-black">
                Activity notes
              </label>
              <textarea
                id={`${key}-notes`}
                value={notes}
                onChange={(e) => dispatch({ type: "notes/set", key, value: e.target.value })}
                className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
                placeholder="Capture outputs, decisions, observations, and evidence..."
              />
            </div>

            <ArtefactCapture activityKeyValue={key} artefacts={artefacts} dispatch={dispatch} />

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3">
              <BookOpen className="h-4 w-4 text-slate-600" />
              <div className="min-w-0 flex-1">
                <strong className="text-sm">{a.guideTitle}</strong>
                <p className="truncate text-xs text-slate-500">{a.guideSubtitle}</p>
              </div>

              {a.id === "hmw" ? (
                <Button variant="secondary" onClick={openHmw}>
                  Open Tool
                </Button>
              ) : null}

              {guide ? (
                <Button variant="secondary" onClick={() => setSelectedGuide(guide)}>
                  <BookOpen className="h-4 w-4" /> Open guide
                </Button>
              ) : null}

              {isRunning ? (
                <Button variant="secondary" onClick={() => dispatch({ type: "activity/stop" })}>
                  <X className="h-4 w-4" /> Stop
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => dispatch({ type: "activity/run", key })} disabled={isDone}>
                  <Play className="h-4 w-4" /> Run Activity
                </Button>
              )}

              <Button variant={isDone ? "primary" : "secondary"} onClick={() => dispatch({ type: "activity/toggleComplete", key })}>
                <CheckCircle2 className="h-4 w-4" /> {isDone ? "Completed" : "Mark Complete"}
              </Button>
            </div>
          </Panel>
        );
      })}

      <GuideDrawer guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
    </div>
  );
}

// Helper functions and components for artefact grouping and cards

function getNoteGroupDescription(noteKind: Artefact["noteKind"]) {
  switch (noteKind) {
    case "insight":
      return "What the team has learned or noticed.";
    case "opportunity":
      return "Possible areas to explore, improve, or prototype.";
    case "parking":
      return "Useful but off-track items to revisit later.";
    case "decision":
      return "Choices made during the sprint.";
    case "risk":
      return "Concerns, blockers, assumptions, or things to validate.";
    case "question":
      return "Open questions the team still needs to answer.";
    default:
      return "Captured sprint note artefacts.";
  }
}

function ArtefactGroup({
  title,
  description,
  icon: Icon,
  badgeClassName,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  badgeClassName: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-slate-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left transition hover:bg-slate-100"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white", badgeClassName)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-black">{title}</h4>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-600 shadow-sm">{count}</span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500">
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {expanded ? <div className="border-t bg-white p-3">{children}</div> : null}
    </section>
  );
}

function CompactNoteArtefactPreview({ artefact, expanded }: { artefact: Artefact; expanded: boolean }) {
  const noteType = getNoteArtefactType(artefact.noteKind);
  const Icon = noteType.icon;

  return (
    <div className={cx("flex items-center gap-3 p-3 text-white bg-gradient-to-r", noteType.color)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">{noteType.label}</span>
        </div>
        <div className="mt-1 truncate text-sm font-black">{artefact.name || "Untitled note"}</div>
        <div className="mt-0.5 line-clamp-1 text-xs text-white/75">{artefact.caption || "Add note details."}</div>
      </div>
      {expanded ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronRight className="h-4 w-4 text-white/70" />}
    </div>
  );
}

function ArtefactCard({
  artefact,
  activityKeyValue,
  dispatch,
}: {
  artefact: Artefact;
  activityKeyValue: string;
  dispatch: React.Dispatch<Action>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="block w-full text-left">
        {artefact.type === "photo" && artefact.dataUrl ? (
          <div className="flex items-center gap-3 p-3 hover:bg-slate-50">
            <img src={artefact.dataUrl} alt={artefact.caption || artefact.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black">{artefact.name || "Untitled photo"}</div>
              <div className="mt-1 line-clamp-2 text-xs text-slate-500">{artefact.caption || "No caption yet."}</div>
            </div>
            {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </div>
        ) : (
          <CompactNoteArtefactPreview artefact={artefact} expanded={expanded} />
        )}
      </button>

      {expanded ? (
        <div className="space-y-2 border-t bg-slate-50 p-3">
          {artefact.type === "photo" && artefact.dataUrl ? (
            <img src={artefact.dataUrl} alt={artefact.caption || artefact.name} className="max-h-72 w-full rounded-xl object-cover" />
          ) : (
            <NoteArtefactPreview artefact={artefact} />
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black">{artefact.name}</div>
              <div className="text-xs text-slate-500">Saved to {activityKeyValue}</div>
            </div>
            <Button
              variant="ghost"
              className="px-2 py-1"
              onClick={() => dispatch({ type: "artefact/remove", key: activityKeyValue, artefactId: artefact.id })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <input
            value={artefact.name}
            onChange={(event) =>
              dispatch({
                type: "artefact/updateName",
                key: activityKeyValue,
                artefactId: artefact.id,
                name: event.target.value,
              })
            }
            className="w-full rounded-lg border bg-white p-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-950"
            placeholder={artefact.type === "photo" ? "Photo title e.g. Problem map" : "Note title e.g. Key opportunity"}
          />

          {artefact.type === "note" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {noteArtefactTypes.map((type) => {
                const Icon = type.icon;
                const active = artefact.noteKind === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "artefact/updateNoteKind",
                        key: activityKeyValue,
                        artefactId: artefact.id,
                        noteKind: type.id,
                      })
                    }
                    className={cx(
                      "inline-flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-black transition",
                      active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {type.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <textarea
            value={artefact.caption}
            onChange={(event) =>
              dispatch({
                type: "artefact/updateCaption",
                key: activityKeyValue,
                artefactId: artefact.id,
                caption: event.target.value,
              })
            }
            className="min-h-20 w-full rounded-lg border bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-slate-950"
            placeholder={artefact.type === "photo" ? "Caption this photo e.g. Problem map wall" : "Write the note details..."}
          />
        </div>
      ) : null}
    </div>
  );
}

function ArtefactCapture({
  activityKeyValue,
  artefacts,
  dispatch,
}: {
  activityKeyValue: string;
  artefacts: Artefact[];
  dispatch: React.Dispatch<Action>;
}) {
  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      dispatch({
        type: "artefact/add",
        key: activityKeyValue,
        artefact: {
          id: `${activityKeyValue}-${Date.now()}-${file.name}`,
          activityKey: activityKeyValue,
          type: "photo",
          name: file.name,
          dataUrl,
          caption: "",
          createdAt: Date.now(),
        },
      });
    }
  };

  const [noteMenuOpen, setNoteMenuOpen] = useState(false);

  const addQuickNote = (noteKind: Artefact["noteKind"]) => {
    const noteType = getNoteArtefactType(noteKind);

    dispatch({
      type: "artefact/add",
      key: activityKeyValue,
      artefact: {
        id: `${activityKeyValue}-${Date.now()}-note`,
        activityKey: activityKeyValue,
        type: "note",
        name: `Untitled ${noteType.label.toLowerCase()}`,
        caption: "",
        noteKind: noteType.id,
        createdAt: Date.now(),
      },
    });
    setNoteMenuOpen(false);
  };

  const photoArtefacts = artefacts.filter((artefact) => artefact.type === "photo");
  const noteArtefactGroups = noteArtefactTypes
    .map((type) => ({
      ...type,
      artefacts: artefacts.filter((artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === type.id),
    }))
    .filter((group) => group.artefacts.length > 0);

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => ({ photos: true }));

  const isGroupExpanded = (groupId: string) => expandedGroups[groupId] ?? true;
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({ ...current, [groupId]: !(current[groupId] ?? true) }));
  };

  return (
    <div className="mt-4 rounded-xl border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black">Artefacts</h3>
          <p className="mt-1 text-xs text-slate-500">
            Capture sprint-wall photos, sketches, sticky notes, and room outputs for the report.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-950 focus-within:ring-offset-2">
            <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} />
            <Download className="h-4 w-4" /> Upload photos
          </label>
          <div className="relative">
            <Button variant="secondary" onClick={() => setNoteMenuOpen((open) => !open)}>
              <Plus className="h-4 w-4" /> Add note <ChevronDown className="h-4 w-4" />
            </Button>
            {noteMenuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Choose note type
                </div>
                <div className="p-1">
                  {noteArtefactTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => addQuickNote(type.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", type.color)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {artefacts.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No artefacts captured yet. Upload a photo of the wall, sketches, voting board, or add a quick note.
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {photoArtefacts.length > 0 ? (
            <ArtefactGroup
              title="Photos"
              description="Room photos, sprint wall captures, sketches, and physical artefacts."
              icon={Download}
              badgeClassName="bg-slate-100 text-slate-700"
              count={photoArtefacts.length}
              expanded={isGroupExpanded("photos")}
              onToggle={() => toggleGroup("photos")}
            >
              <div className="grid gap-2">
                {photoArtefacts.map((artefact) => (
                  <ArtefactCard key={artefact.id} artefact={artefact} activityKeyValue={activityKeyValue} dispatch={dispatch} />
                ))}
              </div>
            </ArtefactGroup>
          ) : null}

          {noteArtefactGroups.map((group) => {
            const Icon = group.icon;
            return (
              <ArtefactGroup
                key={group.id}
                title={group.label}
                description={getNoteGroupDescription(group.id)}
                icon={Icon}
                badgeClassName={cx("text-white bg-gradient-to-r", group.color)}
                count={group.artefacts.length}
                expanded={isGroupExpanded(group.id)}
                onToggle={() => toggleGroup(group.id)}
              >
                <div className="grid gap-2">
                  {group.artefacts.map((artefact) => (
                    <ArtefactCard key={artefact.id} artefact={artefact} activityKeyValue={activityKeyValue} dispatch={dispatch} />
                  ))}
                </div>
              </ArtefactGroup>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Guide({ day }: { day: SprintDay }) {
  if (day.id === "day2") {
    return (
      <GuidePanel
        title="Four-Step Sketch Process"
        items={[
          "Notes — review yesterday’s work",
          "Ideas — rough approaches",
          "Crazy 8s — eight variations in eight minutes",
          "Solution Sketch — detailed, self-explanatory concept",
        ]}
      />
    );
  }

  if (day.id === "day3") {
    return (
      <GuidePanel
        title="Prototyping Best Practices"
        items={[
          "Focus on the critical path",
          "Use realistic content",
          "Make it feel authentic",
          "Do not build the whole product",
          "Fake anything that does not need to work",
        ]}
      />
    );
  }

  if (day.id === "day4") {
    return (
      <GuidePanel
        title="Testing Guide"
        items={[
          "Recruit representative users",
          "Ask open-ended questions",
          "Observe behaviour over opinions",
          "Debrief after each session",
          "Look for repeated patterns",
        ]}
      />
    );
  }

  return (
    <DayResources
      day={day}
      openHmw={() => undefined}
    />
  );
}

function GuidePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <Panel className="p-5">
        <h2 className="font-black">{title}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
      <Panel className="p-5">
        <h2 className="font-black">Facilitator Tips</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
          <li>Set clear expectations at the start.</li>
          <li>Time-box everything.</li>
          <li>Work silently where possible to reduce groupthink.</li>
          <li>Keep decisions visible.</li>
        </ul>
      </Panel>
    </div>
  );
}

function DayResources({ day, openHmw }: { day: SprintDay; openHmw: () => void }) {
  const cards = day.id === "day1" ? [["Problem Mapping Template", "Visual template for mapping user journeys and identifying pain points.", "Download Template"], ["Expert Interview Script", "Sample questions and structure for conducting expert interviews.", "Download Script"], ["How Might We Generator", "Interactive tool to help generate better How Might We questions.", "Open Tool"], ["Voting & Decision Framework", "Structured approach for making decisions and selecting targets.", "Download Framework"]] : [[`${day.label} Worksheet`, `Support template for ${day.title}.`, "Download Template"], [day.guideLabel, `Practical support for running ${day.label}.`, "View Guide"], ["Decision Log", "Capture key decisions and outputs.", "Open Log"], ["Facilitator Checklist", "Keep the session on track.", "View Checklist"]];
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      {cards.map(([title, desc, action]) => (
        <Panel key={title} className="p-5">
          <h2 className="flex items-center gap-2 font-black">
            <BookOpen className="h-4 w-4" /> {title}
          </h2>
          <p className="mt-7 text-sm leading-6 text-slate-500">{desc}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={title.includes("How Might") ? openHmw : undefined}>
            {action}
          </Button>
        </Panel>
      ))}
    </div>
  );
}

function TimerPage({ setPage }: { setPage: (page: Page) => void }) {
  const [minutes, setMinutes] = useState(5);
  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <Button variant="secondary" onClick={() => setPage("dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <h1 className="mt-6 text-3xl font-black">Activity Timer</h1>
      <p className="mt-1 text-slate-500">Time-box your design sprint activities for maximum effectiveness</p>

      <Panel className="mt-6 p-6 text-center">
        <h2 className="text-left font-black">Activity Timer</h2>
        <p className="text-left text-sm text-slate-500">Activity</p>

        <div className="mt-8 font-mono text-6xl font-black tabular-nums">{String(minutes).padStart(2, "0")}:00</div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => setMinutes(Math.max(1, minutes - 1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500">Minutes</span>
          <Button variant="secondary" onClick={() => setMinutes(minutes + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[1, 3, 5, 8, 15, 30].map((m) => (
            <Button key={m} variant="secondary" onClick={() => setMinutes(m)}>
              {m} min
            </Button>
          ))}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          <Button>
            <Play className="h-4 w-4" /> Start
          </Button>
          <Button variant="secondary">
            <RefreshCw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </Panel>
    </main>
  );
}

function ResourcesPage({ setPage }: { setPage: (page: Page) => void }) {
  const [tab, setTab] = useState<ResourceTab>("facilitation");
  const totalGuides = resourceCategories.reduce((count, category) => count + category.guides.length, 0);
  const [selectedGuide, setSelectedGuide] = useState<ResourceGuide | null>(null);

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <Button variant="secondary" onClick={() => setPage("dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="text-3xl font-black">Resource Library</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            A facilitator operating system for running a design sprint, not just a collection of templates. Start with the playbook, then use the guides, scripts, and troubleshooting resources when you need them.
          </p>
        </div>
        <Panel className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-black">{totalGuides}</div>
              <div className="text-xs font-bold text-slate-500">Guides</div>
            </div>
            <div>
              <div className="text-2xl font-black">6</div>
              <div className="text-xs font-bold text-slate-500">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-black">4</div>
              <div className="text-xs font-bold text-slate-500">Sprint days</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button onClick={() => setTab("facilitation")} className={cx("rounded-xl py-2 text-sm font-black", tab === "facilitation" && "bg-white shadow-sm")}>
          Guides & Playbooks
        </button>
        <button onClick={() => setTab("templates")} className={cx("rounded-xl py-2 text-sm font-black", tab === "templates" && "bg-white shadow-sm")}>
          Templates & Tools
        </button>
      </div>

      {tab === "facilitation" ? <ResourceGuideLibrary onOpenGuide={setSelectedGuide} /> : <ResourceTemplateLibrary />}
      <GuideDrawer guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
    </main>
  );
}

function ResourceGuideLibrary({ onOpenGuide }: { onOpenGuide: (guide: ResourceGuide) => void }) {
  return (
    <div className="mt-4 space-y-5">
      <DarkPanel className="border-0 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Recommended starting point</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              If someone is new to design sprints, start with the Sprint Facilitation Playbook, Setup & Logistics, and Day Opening & Closing Scripts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">1. Setup</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">2. Playbook</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">3. Scripts</span>
          </div>
        </div>
      </DarkPanel>

      {resourceCategories.map((category) => (
        <ResourceCategorySection key={category.title} category={category} onOpenGuide={onOpenGuide} />
      ))}
    </div>
  );
}

function ResourceCategorySection({
  category,
  onOpenGuide,
}: {
  category: { title: string; description: string; guides: ResourceGuide[] };
  onOpenGuide: (guide: ResourceGuide) => void;
}) {
  const [expanded, setExpanded] = useState(category.title === "Foundations" || category.title === "Run the Sprint");

  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">{category.title}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">{category.guides.length}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{category.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500">
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {expanded ? (
        <div className="grid gap-4 border-t bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-3">
          {category.guides.map((guide) => (
            <ResourceGuideCard key={guide.title} guide={guide} onOpen={() => onOpenGuide(guide)} />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function ResourceGuideCard({ guide, onOpen }: { guide: ResourceGuide; onOpen: () => void }) {
  const Icon = guide.icon;
  return (
    <article className="flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
          {guide.kind}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="mt-4 text-base font-black">{guide.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>

        <div className="mt-4 grid gap-2 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-slate-700">Stage</span>
            <span>{guide.stage}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-slate-700">Audience</span>
            <span className="text-right">{guide.audience}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-slate-700">Use</span>
            <span>{guide.time}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Button variant="secondary" className="w-full" onClick={onOpen}>
          <BookOpen className="h-4 w-4" /> Open guide
        </Button>
      </div>
    </article>
  );
}

function GuideDrawer({ guide, onClose }: { guide: ResourceGuide | null; onClose: () => void }) {
  if (!guide) return null;

  const Icon = guide.icon;
  const content = getGuideContent(guide);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={guide.title}>
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black">{guide.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">{guide.kind}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{content.summary}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <GuideMiniPanel label="Stage" value={guide.stage} />
            <GuideMiniPanel label="Audience" value={guide.audience} />
            <GuideMiniPanel label="Use" value={guide.time} />
          </div>

          <GuideSection title="Use this when" items={content.useWhen} />

          <section className="mt-5 rounded-2xl border bg-slate-50 p-4">
            <h3 className="font-black">Facilitation pattern</h3>
            <div className="mt-4 space-y-3">
              {content.steps.map((step, index) => (
                <div key={step.title} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span>
                    <div>
                      <h4 className="font-black">{step.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <GuideSection title="Facilitator prompts" items={content.facilitatorPrompts} />
            <GuideSection title="Checklist" items={content.checklist} />
            <GuideSection title="Watchouts" items={content.watchouts} tone="warning" />
            <GuideSection title="Outputs to capture" items={content.outputs} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideMiniPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function GuideSection({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "warning" }) {
  return (
    <section className={cx("mt-5 rounded-2xl border p-4", tone === "warning" ? "border-amber-200 bg-amber-50" : "bg-white")}>
      <h3 className="font-black">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={cx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "warning" ? "bg-amber-500" : "bg-slate-950")} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceTemplateLibrary() {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {resourceTemplateCards.map((template) => (
        <Panel key={template} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">{template}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Reusable worksheet or canvas to support live sprint activities.</p>
            </div>
            <Download className="h-5 w-5 text-slate-400" />
          </div>
          <Button variant="secondary" className="mt-4 w-full">
            <Eye className="h-4 w-4" /> Preview template
          </Button>
        </Panel>
      ))}
    </div>
  );
}

function HmwModal({
  open,
  onClose,
  state,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  state: AppState;
  dispatch: React.Dispatch<Action>;
}) {
  const [tab, setTab] = useState<HmwTab>("generate");
  const [problem, setProblem] = useState("users struggle to find relevant information quickly on our website");
  const [targetUser, setTargetUser] = useState("busy parents");
  const [context, setContext] = useState("during onboarding, time constraints");
  if (!open) return null;
  const generate = () => {
    const qs = [
      `How might we help ${targetUser} achieve their goals despite ${problem}?`,
      `How might we empower ${targetUser} to feel more confident when navigating this process?`,
      `How might we reduce the frustration ${targetUser} feel when ${problem}?`,
      `How might we make ${targetUser} feel more supported throughout ${context}?`,
    ];
    dispatch({ type: "hmw/addMany", questions: qs, writeToDay1HmwNotes: true });
    setTab("saved");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <HelpCircle className="h-5 w-5" /> How Might We Generator
            </h2>
            <p className="text-sm text-slate-500">Interactive tool to help generate better How Might We questions.</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-4 rounded-2xl bg-slate-100 p-1">
          {(["generate", "saved", "templates", "guide"] as HmwTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("rounded-xl py-2 text-sm font-black capitalize", tab === t && "bg-white shadow-sm")}>
              {t}
            </button>
          ))}
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {tab === "generate" ? (
            <Panel className="p-5">
              <h3 className="text-lg font-black">Problem Definition</h3>

              <label className="mt-6 block text-sm font-black">Problem or Challenge *</label>
              <input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
              />

              <label className="mt-4 block text-sm font-black">Target User</label>
              <input
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
              />

              <label className="mt-4 block text-sm font-black">Context</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
              />

              <Button className="mt-4 w-full" onClick={generate}>
                <Lightbulb className="h-4 w-4" /> Generate HMW Questions
              </Button>
            </Panel>
          ) : null}

          {tab === "saved" ? (
            <Panel className="p-8 text-center">
              {state.hmws.length === 0 ? (
                <>
                  <CheckCircle2 className="mx-auto h-14 w-14 text-slate-400" />
                  <h3 className="mt-4 font-black">No Saved Questions Yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Generate HMW questions and save your favourites.</p>
                </>
              ) : (
                <div className="space-y-2 text-left">
                  {state.hmws.map((q) => (
                    <div key={q} className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 text-sm">
                      <span className="flex-1">{q}</span>
                      <Copy className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          ) : null}

          {tab === "templates" ? (
            <GuidePanel
              title="HMW Templates"
              items={[
                "How might we help [users] achieve their goals despite [challenge]?",
                "How might we empower [users] to feel more confident?",
                "How might we reduce frustration when [problem] occurs?",
                "How might we make [process] feel more supportive?",
              ]}
            />
          ) : null}

          {tab === "guide" ? (
            <GuidePanel
              title="HMW Question Quality Framework"
              items={["User-centred", "Actionable", "Broad enough to inspire options", "Specific enough to focus the team", "Positive framing", "Solution-neutral"]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HelperPanel({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  if (!open) {
    return (
      <button
        aria-label="Open facilitator helper"
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <aside className="fixed bottom-8 right-8 z-40 w-[360px] rounded-2xl border bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="flex items-center gap-2 font-black">
          <Bot className="h-5 w-5 text-blue-600" /> Facilitator Helper
        </h2>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-xl bg-slate-100 p-3 text-sm leading-6">
          Hi! I’m your Facilitator Helper. I can help with timers, navigation, and design sprint questions.
        </div>
        <div className="rounded-xl bg-yellow-100 p-3 text-sm leading-6 text-yellow-900">
          Say “Helper” followed by a command, or click the mic button to start listening.
        </div>
      </div>

      <div className="border-t p-4">
        <div className="mb-2 flex gap-2">
          <Button variant="secondary" className="px-3">
            <Mic className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="px-3">
            <Clock className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="px-3">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
            placeholder="Type a message or say 'Helper' + command..."
          />
          <Button className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function ReportPage({ state, onNavigate }: { state: AppState; onNavigate: (page: Page) => void }) {
  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const day of sprintDays) {
      for (const a of day.activities) keys.push(activityKey(day.id, a.id));
    }
    return keys;
  }, []);

  const progress = useMemo(() => {
    const progressed = allKeys.filter(
      (k) => state.completed.includes(k) || state.runningActivityId === k || (state.notes[k] ?? "").trim().length > 0,
    );
    const total = allKeys.length;
    const count = progressed.length;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { total, count, pct };
  }, [allKeys, state.completed, state.notes, state.runningActivityId]);

  const notesCount = useMemo(() => Object.values(state.notes).filter((v) => v.trim().length > 0).length, [state.notes]);

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <Button variant="secondary" onClick={() => onNavigate("dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Sprint Report</h1>
          <p className="mt-1 text-slate-500">Generated from your captured sprint setup, activity progress, HMWs, and notes.</p>
        </div>
        <Button>
          <Download className="h-4 w-4" /> Export report
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="p-6 lg:col-span-2">
          <h2 className="text-lg font-black">Setup</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Sprint name</div>
              <div className="mt-1 font-semibold">{state.sprintName || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current day</div>
              <div className="mt-1 font-semibold">{dayLabel(state.currentDay)}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Challenge</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{state.challenge || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Target users</div>
              <div className="mt-1 text-sm text-slate-700">{state.targetUsers || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Desired outcome</div>
              <div className="mt-1 text-sm text-slate-700">{state.desiredOutcome || "—"}</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-lg font-black">Progress</h2>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold">
            <span>Activities progressed</span>
            <span>
              {progress.count}/{progress.total} ({progress.pct}%)
            </span>
          </div>
          <div className="mt-3">
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full transition-[width] duration-500"
                style={sprintProgressFillStyle(progress.pct)}
              />
              <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                <div className="border-r border-white/70" />
                <div className="border-r border-white/70" />
                <div className="border-r border-white/70" />
                <div />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Completed</span>
              <span>{state.completed.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Notes saved</span>
              <span>{notesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">HMWs saved</span>
              <span>{state.hmws.length}</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black">How Might We</h2>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{state.hmws.length} saved</span>
          </div>
          {state.hmws.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No HMW questions saved yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {state.hmws.slice(0, 12).map((q) => (
                <li key={q} className="rounded-xl border bg-white p-3">
                  {q}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="text-lg font-black">Notes</h2>
          <p className="mt-1 text-sm text-slate-500">Top notes captured during activities.</p>
          <div className="mt-4 space-y-3">
            {Object.entries(state.notes)
              .filter(([, v]) => v.trim().length > 0)
              .slice(0, 8)
              .map(([key, value]) => (
                <div key={key} className="rounded-2xl border bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">{key}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{value.slice(0, 500)}</div>
                </div>
              ))}
            {notesCount === 0 ? <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">No activity notes yet.</div> : null}
          </div>
        </Panel>
      </div>
    </main>
  );
}

export default function DesignSprintFacilitatorApp() {
  const [page, setPage] = useState<Page>("dashboard");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hmwOpen, setHmwOpen] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const currentDay = useMemo(() => sprintDays.find((day) => day.id === page), [page]);

  const onNavigate = (nextPage: Page) => {
    setPage(nextPage);
    if (DAY_IDS.includes(nextPage as DayId)) dispatch({ type: "nav/setDay", dayId: nextPage as DayId });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950" style={{ fontFamily: "Roboto, Arial, Helvetica, sans-serif" }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <Header page={page} onNavigate={onNavigate} currentDay={state.currentDay} sprintName={state.sprintName} />

      <div id="main">
        {page === "dashboard" ? (
          <Dashboard state={state} dispatch={dispatch} onNavigate={onNavigate} openHmw={() => setHmwOpen(true)} />
        ) : null}

        {currentDay ? (
          <DayPage day={currentDay} state={state} dispatch={dispatch} onNavigate={onNavigate} openHmw={() => setHmwOpen(true)} />
        ) : null}

        {page === "timer" ? <TimerPage setPage={onNavigate} /> : null}
        {page === "resources" ? <ResourcesPage setPage={onNavigate} /> : null}
        {page === "report" ? <ReportPage state={state} onNavigate={onNavigate} /> : null}
      </div>

      <footer className="mt-16 border-t bg-slate-50 py-8 text-center text-sm text-slate-500">
        <p>Design Sprint Facilitator - Your complete guide to running successful 4-day design sprints</p>
        <p className="mt-2">Built for design teams, product managers, and innovation facilitators</p>
      </footer>

      <HelperPanel open={helperOpen} setOpen={setHelperOpen} />
      <HmwModal open={hmwOpen} onClose={() => setHmwOpen(false)} state={state} dispatch={dispatch} />
    </div>
  );
}

function NoteArtefactPreview({ artefact }: { artefact: Artefact }) {
  const noteType = getNoteArtefactType(artefact.noteKind);
  const Icon = noteType.icon;

  return (
    <div className={cx("flex h-36 flex-col justify-between p-4 text-white rounded-xl bg-gradient-to-br", noteType.color)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
          <Icon className="h-3.5 w-3.5" /> {noteType.label}
        </div>
      </div>
      <div>
        <div className="line-clamp-2 text-lg font-black">{artefact.name || "Untitled note"}</div>
        <div className="mt-1 line-clamp-2 text-sm text-white/65">{artefact.caption || "Add note details below."}</div>
      </div>
    </div>
  );
}