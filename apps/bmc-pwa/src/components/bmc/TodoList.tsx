import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Circle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TodoItem } from '@/types';
import { cn } from '@/lib/utils';

interface TodoListProps {
  todos: TodoItem[];
  onToggle: (todoId: string) => void;
  onAdd: (content: string) => void;
  onDelete: (todoId: string) => void;
  className?: string;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onAdd,
  onDelete,
  className
}) => {
  const [newTodo, setNewTodo] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      onAdd(newTodo.trim());
      setNewTodo('');
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTodo();
    }
  };

  const completedTodos = todos.filter(todo => todo.completed);
  const pendingTodos = todos.filter(todo => !todo.completed);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Action Items
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {completedTodos.length}/{todos.length} done
          </span>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Add new todo */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Textarea
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
              className="min-h-[60px] text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddTodo}
                size="sm"
                disabled={!newTodo.trim()}
                className="gap-1"
              >
                <Check className="w-3 h-3" />
                Add
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setNewTodo('');
                }}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Todo list */}
      {todos.length === 0 && !isAdding ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Circle className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            No action items yet
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Add tasks to track your progress on this section
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pending todos */}
          <AnimatePresence>
            {pendingTodos.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="todo-item"
              >
                <Button
                  onClick={() => onToggle(todo.id)}
                  size="sm"
                  variant="ghost"
                  className="h-auto p-1 flex-shrink-0"
                >
                  <Circle className="w-4 h-4 text-gray-400" />
                </Button>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {todo.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added {new Date(todo.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <Button
                  onClick={() => onDelete(todo.id)}
                  size="sm"
                  variant="ghost"
                  className="h-auto p-1 flex-shrink-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Completed todos */}
          {completedTodos.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 font-medium mt-4 mb-2">
                Completed ({completedTodos.length})
              </div>
              <AnimatePresence>
                {completedTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="todo-item opacity-60"
                  >
                    <Button
                      onClick={() => onToggle(todo.id)}
                      size="sm"
                      variant="ghost"
                      className="h-auto p-1 flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 line-through leading-relaxed">
                        {todo.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Completed {new Date(todo.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => onDelete(todo.id)}
                      size="sm"
                      variant="ghost"
                      className="h-auto p-1 flex-shrink-0 text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};