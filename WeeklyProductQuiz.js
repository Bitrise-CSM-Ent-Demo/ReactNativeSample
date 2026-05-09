'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  ScrollView,
} from 'react-native';

const QUIZ_BANKS = [
  [
    {
      question: 'Which platform does Bitrise primarily support?',
      options: ['Mobile CI/CD', 'Web hosting', 'Database management', 'Email marketing'],
      answer: 0,
    },
    {
      question: 'What does CI/CD stand for?',
      options: [
        'Continuous Integration / Continuous Delivery',
        'Code Inspection / Code Deployment',
        'Central Interface / Core Distribution',
        'Component Integration / Component Delivery',
      ],
      answer: 0,
    },
    {
      question: 'Which file format does Bitrise use for workflow configuration?',
      options: ['bitrise.yml', 'bitrise.json', 'bitrise.xml', 'bitrise.toml'],
      answer: 0,
    },
    {
      question: 'What is a Bitrise Step?',
      options: [
        'A reusable build task',
        'A deployment environment',
        'A test report',
        'A code branch',
      ],
      answer: 0,
    },
    {
      question: 'Which of these is a Bitrise trigger type?',
      options: ['Push', 'Database update', 'File upload', 'Email receipt'],
      answer: 0,
    },
  ],
  [
    {
      question: 'What is React Native primarily used for?',
      options: [
        'Building mobile apps with JavaScript',
        'Building web servers',
        'Managing databases',
        'Writing native iOS apps only',
      ],
      answer: 0,
    },
    {
      question: 'Which command starts a React Native packager?',
      options: ['react-native start', 'npm run dev', 'react start', 'node server.js'],
      answer: 0,
    },
    {
      question: 'What does the AppRegistry.registerComponent method do?',
      options: [
        'Registers the root app component',
        'Registers a native module',
        'Starts the JavaScript engine',
        'Connects to the app store',
      ],
      answer: 0,
    },
    {
      question: 'Which React Native component is used for scrollable lists?',
      options: ['ScrollView', 'ListView', 'FlatList', 'All of the above'],
      answer: 3,
    },
    {
      question: 'What language is used to write React Native apps?',
      options: ['JavaScript', 'Swift', 'Kotlin', 'C++'],
      answer: 0,
    },
  ],
  [
    {
      question: 'What is a Bitrise Stack?',
      options: [
        'A virtual machine environment for builds',
        'A list of workflows',
        'A set of environment variables',
        'A collection of test results',
      ],
      answer: 0,
    },
    {
      question: 'Which Bitrise feature allows scheduled builds?',
      options: ['Triggers', 'Stacks', 'Caches', 'Artifacts'],
      answer: 0,
    },
    {
      question: 'What are Bitrise Secrets used for?',
      options: [
        'Storing sensitive environment variables',
        'Encrypting build artifacts',
        'Hiding workflow steps',
        'Protecting source code',
      ],
      answer: 0,
    },
    {
      question: 'Which mobile platforms does Bitrise support?',
      options: ['iOS and Android', 'iOS only', 'Android only', 'Windows Phone'],
      answer: 0,
    },
    {
      question: 'What is the Bitrise Step Library?',
      options: [
        'A collection of open-source build steps',
        'A code repository',
        'A documentation site',
        'A test suite',
      ],
      answer: 0,
    },
  ],
];

function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now - startOfYear;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneWeek);
}

function getWeeklyQuestions() {
  const week = getWeekNumber();
  return QUIZ_BANKS[week % QUIZ_BANKS.length];
}

class WeeklyProductQuiz extends Component {
  constructor(props) {
    super(props);
    const questions = getWeeklyQuestions();
    this.state = {
      questions,
      currentIndex: 0,
      selectedOption: null,
      score: 0,
      answered: false,
      finished: false,
    };
  }

  handleOptionPress(index) {
    if (this.state.answered) return;
    const correct = this.state.questions[this.state.currentIndex].answer === index;
    this.setState({
      selectedOption: index,
      answered: true,
      score: correct ? this.state.score + 1 : this.state.score,
    });
  }

  handleNext() {
    const nextIndex = this.state.currentIndex + 1;
    if (nextIndex >= this.state.questions.length) {
      this.setState({ finished: true });
    } else {
      this.setState({
        currentIndex: nextIndex,
        selectedOption: null,
        answered: false,
      });
    }
  }

  handleRestart() {
    this.setState({
      currentIndex: 0,
      selectedOption: null,
      score: 0,
      answered: false,
      finished: false,
    });
  }

  renderOptions(question) {
    return question.options.map((option, i) => {
      let optionStyle = styles.option;
      let textStyle = styles.optionText;

      if (this.state.answered) {
        if (i === question.answer) {
          optionStyle = styles.optionCorrect;
          textStyle = styles.optionTextSelected;
        } else if (i === this.state.selectedOption) {
          optionStyle = styles.optionWrong;
          textStyle = styles.optionTextSelected;
        }
      } else if (i === this.state.selectedOption) {
        optionStyle = styles.optionSelected;
        textStyle = styles.optionTextSelected;
      }

      return (
        <TouchableHighlight
          key={i}
          style={optionStyle}
          underlayColor="#ddd"
          onPress={() => this.handleOptionPress(i)}
        >
          <Text style={textStyle}>{option}</Text>
        </TouchableHighlight>
      );
    });
  }

  renderResult() {
    const { score, questions } = this.state;
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    let message = 'Keep practising!';
    if (pct === 100) message = 'Perfect score!';
    else if (pct >= 80) message = 'Great job!';
    else if (pct >= 60) message = 'Good effort!';

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Quiz Complete!</Text>
        <Text style={styles.resultScore}>{score} / {total}</Text>
        <Text style={styles.resultMessage}>{message}</Text>
        <TouchableHighlight
          style={styles.button}
          underlayColor="#0056b3"
          onPress={() => this.handleRestart()}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableHighlight>
      </View>
    );
  }

  renderQuestion() {
    const { questions, currentIndex, answered } = this.state;
    const question = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;

    return (
      <ScrollView contentContainerStyle={styles.quizContainer}>
        <View style={styles.progressBar}>
          <Text style={styles.progressText}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
        </View>
        <Text style={styles.questionText}>{question.question}</Text>
        <View style={styles.optionsContainer}>
          {this.renderOptions(question)}
        </View>
        {answered && (
          <TouchableHighlight
            style={styles.button}
            underlayColor="#0056b3"
            onPress={() => this.handleNext()}
          >
            <Text style={styles.buttonText}>{isLast ? 'See Results' : 'Next'}</Text>
          </TouchableHighlight>
        )}
      </ScrollView>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weekly Product Quiz</Text>
          <Text style={styles.headerSubtitle}>
            Week {getWeekNumber() + 1}
          </Text>
        </View>
        {this.state.finished ? this.renderResult() : this.renderQuestion()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#cce4ff',
    fontSize: 14,
    marginTop: 4,
  },
  quizContainer: {
    padding: 20,
  },
  progressBar: {
    marginBottom: 12,
  },
  progressText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'right',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  optionCorrect: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  optionWrong: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  optionTextSelected: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  resultMessage: {
    fontSize: 18,
    color: '#555',
    marginBottom: 32,
  },
});

module.exports = WeeklyProductQuiz;
