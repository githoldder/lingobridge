import { coursesApi, homeworkApi, learningRecordsApi, type LearningTask } from './apiClient.ts';

export interface LessonNode {
  id: string;
  courseId: string;
  unit: number;
  lesson: number;
  title: string;
  assignmentNodeId: string;
}

export interface EntryResolution {
  lessonNodeId: string;
  assignmentNodeId: string;
  courseId: string;
  lessonNode: LessonNode;
}

function buildLessonNodeId(courseId: string, unit: number, lesson: number): string {
  return `${courseId}-u${unit}-l${lesson}`;
}

function buildAssignmentNodeId(lessonNodeId: string): string {
  return `${lessonNodeId}-hw`;
}

export async function resolveEntry(params: {
  courseId?: string;
  lessonNodeId?: string;
  fromSchedule?: boolean;
  fromLive?: boolean;
}): Promise<EntryResolution> {
  const courseId = params.courseId;
  if (!courseId) throw new Error('courseId is required for resolveEntry');

  if (params.lessonNodeId) {
    const parts = params.lessonNodeId.replace(`${courseId}-`, '').split('-');
    const unit = parseInt(parts[0].replace('u', ''), 10) || 1;
    const lesson = parseInt(parts[1].replace('l', ''), 10) || 1;
    const lessonNode: LessonNode = {
      id: params.lessonNodeId,
      courseId,
      unit,
      lesson,
      title: `Unit ${unit} Lesson ${lesson}`,
      assignmentNodeId: buildAssignmentNodeId(params.lessonNodeId),
    };
    return {
      lessonNodeId: params.lessonNodeId,
      assignmentNodeId: lessonNode.assignmentNodeId,
      courseId,
      lessonNode,
    };
  }

  const tasks = await homeworkApi.tasks(courseId, { includeAll: true });
  if (tasks.length === 0) {
    const fallback: LessonNode = {
      id: buildLessonNodeId(courseId, 1, 1),
      courseId,
      unit: 1,
      lesson: 1,
      title: 'Unit 1 Lesson 1',
      assignmentNodeId: buildAssignmentNodeId(buildLessonNodeId(courseId, 1, 1)),
    };
    return {
      lessonNodeId: fallback.id,
      assignmentNodeId: fallback.assignmentNodeId,
      courseId,
      lessonNode: fallback,
    };
  }

  const lessonMap = new Map<string, LearningTask[]>();
  for (const task of tasks) {
    const key = `${task.unit}-${task.lesson}`;
    if (!lessonMap.has(key)) lessonMap.set(key, []);
    lessonMap.get(key)!.push(task);
  }

  const lessonNodes: LessonNode[] = [];
  for (const [key, taskList] of lessonMap) {
    const [unit, lesson] = key.split('-').map(Number);
    const nodeId = buildLessonNodeId(courseId, unit, lesson);
    lessonNodes.push({
      id: nodeId,
      courseId,
      unit,
      lesson,
      title: taskList[0].lessonTitle || `Unit ${unit} Lesson ${lesson}`,
      assignmentNodeId: buildAssignmentNodeId(nodeId),
    });
  }

  lessonNodes.sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);

  const active = lessonNodes.find(
    (ln) =>
      ln.unit === 1 && ln.lesson === 1
  ) || lessonNodes[0];

  return {
    lessonNodeId: active.id,
    assignmentNodeId: active.assignmentNodeId,
    courseId,
    lessonNode: active,
  };
}

export async function fetchLessonNodes(courseId: string): Promise<LessonNode[]> {
  const tasks = await homeworkApi.tasks(courseId, { includeAll: true });
  const lessonMap = new Map<string, LearningTask[]>();
  for (const task of tasks) {
    const key = `${task.unit}-${task.lesson}`;
    if (!lessonMap.has(key)) lessonMap.set(key, []);
    lessonMap.get(key)!.push(task);
  }
  const result: LessonNode[] = [];
  for (const [key, taskList] of lessonMap) {
    const [unit, lesson] = key.split('-').map(Number);
    const nodeId = buildLessonNodeId(courseId, unit, lesson);
    result.push({
      id: nodeId,
      courseId,
      unit,
      lesson,
      title: taskList[0].lessonTitle || `Unit ${unit} Lesson ${lesson}`,
      assignmentNodeId: buildAssignmentNodeId(nodeId),
    });
  }
  result.sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);
  return result;
}
