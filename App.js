import React, { useState, useEffect, memo, useMemo } from 'react';
import { PixelRatio } from 'react-native';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function TodoItem({ item, onToggle, onDelete }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const LINE_HEIGHT = 1;
  const EXTRA = 6;
  const SHIFT_RATIO = 0.015;

  const diagonal = Math.sqrt(layout.width * layout.width + layout.height * layout.height);
  const barWidth = diagonal + EXTRA;
  const angleDeg = layout.width === 0 ? 0 : (Math.atan2(layout.height, layout.width) * 180) / Math.PI;

  const proportionalOffset = layout.width * SHIFT_RATIO;
  const densityAdjustment = Math.max(1, PixelRatio.get()) * 0.5;
  const RIGHT_SHIFT = proportionalOffset + densityAdjustment;

  return (
    <View style={styles.rowWrapper}>
      <TouchableOpacity
        onPress={() => onToggle(item.id)}
        activeOpacity={0.8}
        style={[styles.row, item.completed && styles.rowCompleted]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== layout.width || height !== layout.height) setLayout({ width, height });
        }}
      >
        <Text style={[styles.text, item.completed && styles.textCompleted]} numberOfLines={2}>
          {item.text}
        </Text>

        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel="Eliminar tarea"
        >
          <Text style={styles.deleteText}>❌</Text>
        </TouchableOpacity>

        {item.completed && layout.width > 0 && layout.height > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.diagonalLine,
              {
                width: barWidth,
                height: LINE_HEIGHT,
                left: (layout.width - barWidth) / 2 + RIGHT_SHIFT,
                top: (layout.height - LINE_HEIGHT) / 2,
                transform: [{ rotate: `${angleDeg}deg` }],
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
const MemoTodoItem = memo(TodoItem);

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);

  // Cargar tareas guardadas al iniciar
  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await AsyncStorage.getItem('tasks');
        if (data) setTasks(JSON.parse(data));
      } catch (e) {
        console.warn('Error cargando tareas', e);
      }
    };
    cargar();
  }, []);

  // Guardar tareas cada vez que cambian
  useEffect(() => {
    const guardar = async () => {
      try {
        await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      } catch (e) {
        console.warn('Error guardando tareas', e);
      }
    };
    guardar();
  }, [tasks]);

  // Conteo de pendientes (excluye tareas completadas)
  const pendingCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const countMessage = pendingCount === 0 ? 'No hay tareas pendientes' : `Tareas pendientes: ${pendingCount}`;
  const showTooMany = pendingCount > 5;

  const addTask = () => {
    if (task.trim() === '') return;
    const nueva = { id: Date.now().toString(), text: task.trim(), completed: false };
    setTasks((prev) => [...prev, nueva]);
    setTask('');
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Escribe una tarea"
        value={task}
        onChangeText={setTask}
        style={styles.input}
      />
      <Button title="Agregar" onPress={addTask} />

      {/* Mensaje de conteo de pendientes */}
      <Text style={styles.countMessage}>{countMessage}</Text>

      {/* Alerta separada cuando hay demasiadas tareas pendientes */}
      {showTooMany && <Text style={styles.warningMessage}>Demasiadas tareas pendientes</Text>}

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <MemoTodoItem item={item} onToggle={toggleComplete} onDelete={deleteTask} />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    borderRadius: 6,
  },
  countMessage: {
    marginVertical: 8,
    fontWeight: 'bold',
    color: 'black',
  },
  warningMessage: {
    marginBottom: 10,
    color: 'red',
    fontWeight: '700',
  },
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    marginVertical: 5,
    borderRadius: 6,
    position: 'relative',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rowCompleted: {
    backgroundColor: '#f6f6f6',
  },
  text: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    paddingRight: 8,
  },
  textCompleted: {
    color: '#6b6b6b',
    textDecorationLine: 'none', // la diagonal actúa como tachado visual
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 8,
    zIndex: 3,
  },
  deleteText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 18,
  },
  diagonalLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#000',
    opacity: 0.95,
    zIndex: 1,
  },
});
