'use strict';

const React = require('react');
const { act } = require('react-test-renderer');
const renderer = require('react-test-renderer');
const WeeklyProductQuiz = require('../WeeklyProductQuiz');

function createQuiz() {
  const ref = React.createRef();
  let tree;
  act(() => {
    tree = renderer.create(React.createElement(WeeklyProductQuiz, { ref }));
  });
  return { tree, component: ref.current };
}

describe('WeeklyProductQuiz', () => {
  it('renders without crashing', () => {
    const { tree } = createQuiz();
    expect(tree.toJSON()).toBeTruthy();
  });

  it('shows the quiz header', () => {
    const { tree } = createQuiz();
    const texts = findTextNodes(tree.toJSON());
    expect(texts.some(t => t.includes('Weekly Product Quiz'))).toBe(true);
  });

  it('shows question progress on start', () => {
    const { tree } = createQuiz();
    const allText = joinedText(tree.toJSON());
    expect(allText).toContain('Question');
    expect(allText).toContain('of');
  });

  it('starts with score of 0 and first question', () => {
    const { component } = createQuiz();
    expect(component.state.score).toBe(0);
    expect(component.state.currentIndex).toBe(0);
    expect(component.state.finished).toBe(false);
    expect(component.state.answered).toBe(false);
  });

  it('each question has exactly 4 options', () => {
    const { component } = createQuiz();
    component.state.questions.forEach(q => expect(q.options).toHaveLength(4));
  });

  it('increments score on correct answer', () => {
    const { component } = createQuiz();
    const correctIndex = component.state.questions[0].answer;
    act(() => component.handleOptionPress(correctIndex));
    expect(component.state.score).toBe(1);
    expect(component.state.answered).toBe(true);
    expect(component.state.selectedOption).toBe(correctIndex);
  });

  it('does not increment score on wrong answer', () => {
    const { component } = createQuiz();
    const correctIndex = component.state.questions[0].answer;
    const wrongIndex = (correctIndex + 1) % 4;
    act(() => component.handleOptionPress(wrongIndex));
    expect(component.state.score).toBe(0);
    expect(component.state.answered).toBe(true);
  });

  it('ignores taps after answer is already selected', () => {
    const { component } = createQuiz();
    const correctIndex = component.state.questions[0].answer;
    const wrongIndex = (correctIndex + 1) % 4;
    act(() => component.handleOptionPress(correctIndex));
    act(() => component.handleOptionPress(wrongIndex));
    expect(component.state.score).toBe(1);
    expect(component.state.selectedOption).toBe(correctIndex);
  });

  it('advances to next question on handleNext', () => {
    const { component } = createQuiz();
    act(() => component.handleOptionPress(component.state.questions[0].answer));
    act(() => component.handleNext());
    expect(component.state.currentIndex).toBe(1);
    expect(component.state.answered).toBe(false);
    expect(component.state.selectedOption).toBe(null);
  });

  it('sets finished=true after the last question', () => {
    const { component } = createQuiz();
    component.state.questions.forEach(q => {
      act(() => component.handleOptionPress(q.answer));
      act(() => component.handleNext());
    });
    expect(component.state.finished).toBe(true);
  });

  it('resets all state on handleRestart', () => {
    const { component } = createQuiz();
    act(() => component.handleOptionPress(component.state.questions[0].answer));
    act(() => component.handleNext());
    act(() => component.handleRestart());
    expect(component.state.currentIndex).toBe(0);
    expect(component.state.score).toBe(0);
    expect(component.state.answered).toBe(false);
    expect(component.state.finished).toBe(false);
    expect(component.state.selectedOption).toBe(null);
  });

  it('matches snapshot', () => {
    const { tree } = createQuiz();
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

function findTextNodes(node) {
  if (!node) return [];
  if (typeof node === 'string') return [node];
  if (typeof node === 'number') return [String(node)];
  const texts = [];
  if (Array.isArray(node)) {
    node.forEach(child => texts.push(...findTextNodes(child)));
  } else if (node.children) {
    node.children.forEach(child => texts.push(...findTextNodes(child)));
  }
  return texts;
}

function joinedText(node) {
  return findTextNodes(node).join('');
}
