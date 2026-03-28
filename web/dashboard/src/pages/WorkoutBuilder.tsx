import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiSearch, FiSave, FiList, FiClock, FiActivity, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Mock Exercise Database for Iteration 4 Builder
const EXERCISE_LIBRARY = [
    { id: 'ex1', name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
    { id: 'ex2', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
    { id: 'ex3', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell' },
    { id: 'ex4', name: 'Pull-up', muscleGroup: 'Back', equipment: 'Bodyweight' },
    { id: 'ex5', name: 'Dumbbell Lunge', muscleGroup: 'Legs', equipment: 'Dumbbell' },
    { id: 'ex6', name: 'Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
    { id: 'ex7', name: 'Bicep Curl', muscleGroup: 'Arms', equipment: 'Dumbbell' },
    { id: 'ex8', name: 'Tricep Extension', muscleGroup: 'Arms', equipment: 'Cable' },
    { id: 'ex9', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine' },
    { id: 'ex10', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Machine' },
];

interface RoutineExercise {
    id: string; // unique instance id for the routine
    exerciseId: string;
    name: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    restSeconds: number;
}

const WorkoutBuilder = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [workoutTitle, setWorkoutTitle] = useState('New Custom Workout');
    const [routine, setRoutine] = useState<RoutineExercise[]>([]);

    const filteredLibrary = EXERCISE_LIBRARY.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddExercise = (exercise: typeof EXERCISE_LIBRARY[0]) => {
        const newEntry: RoutineExercise = {
            id: Math.random().toString(36).substring(2, 9),
            exerciseId: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            sets: 3,
            reps: 10,
            restSeconds: 60,
        };
        setRoutine([...routine, newEntry]);
        toast.success(`Added ${exercise.name} to routine`);
    };

    const handleRemoveExercise = (instanceId: string) => {
        setRoutine(routine.filter(r => r.id !== instanceId));
    };

    const handleUpdateRoutine = (instanceId: string, field: keyof RoutineExercise, value: number) => {
        setRoutine(routine.map(r => r.id === instanceId ? { ...r, [field]: value } : r));
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === routine.length - 1) return;

        const newRoutine = [...routine];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newRoutine[index];
        newRoutine[index] = newRoutine[targetIndex];
        newRoutine[targetIndex] = temp;
        setRoutine(newRoutine);
    };

    const handleSaveWorkout = () => {
        if (!workoutTitle.trim()) {
            toast.error('Please enter a workout title');
            return;
        }
        if (routine.length === 0) {
            toast.error('Please add at least one exercise to the routine');
            return;
        }

        // Simulate saving to backend
        console.log('Saving workout template:', { title: workoutTitle, exercises: routine });
        toast.success('Workout template saved successfully!');
        
        // Navigate back
        setTimeout(() => navigate('/workouts'), 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/workouts')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                    >
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <input 
                            value={workoutTitle}
                            onChange={(e) => setWorkoutTitle(e.target.value)}
                            className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 m-0 w-full placeholder-gray-400"
                            placeholder="Workout Title..."
                        />
                        <p className="text-gray-500 mt-1">Design a new workout template</p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={handleSaveWorkout}
                        className="btn btn-primary shadow-lg shadow-blue-500/20"
                    >
                        <FiSave className="w-5 h-5 mr-2" />
                        Save Template
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Pane: Exercise Library */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col h-[700px] shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FiList className="mr-2 text-blue-500" />
                            Exercise Library
                        </h2>
                        
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 bg-gray-50"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {filteredLibrary.length > 0 ? (
                                filteredLibrary.map(exercise => (
                                    <div 
                                        key={exercise.id} 
                                        className="p-4 border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition bg-white group cursor-pointer"
                                        onClick={() => handleAddExercise(exercise)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{exercise.name}</h3>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-600">
                                                        {exercise.muscleGroup}
                                                    </span>
                                                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                                                        {exercise.equipment}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                                                <FiPlus />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    No exercises found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Pane: Active Routine */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[700px] shadow-sm flex flex-col">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <FiActivity className="mr-2 text-emerald-500" />
                            Active Routine
                            <span className="ml-3 badge badge-primary">{routine.length} exercises</span>
                        </h2>

                        {routine.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <FiActivity className="w-16 h-16 mb-4 text-gray-200" />
                                <p className="text-lg font-medium text-gray-500">Your routine is empty</p>
                                <p className="mt-2 text-sm text-gray-400">Select exercises from the library to build the workout</p>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {routine.map((item, index) => (
                                    <div key={item.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col sm:flex-row gap-6 relative group transition hover:border-blue-300 shadow-sm">
                                        
                                        {/* Serial Number & Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                                <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-600">
                                                    {item.muscleGroup}
                                                </span>
                                            </div>
                                            
                                            {/* Configuration Inputs */}
                                            <div className="grid grid-cols-3 gap-4 pl-11">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">Sets</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" max="10"
                                                        value={item.sets}
                                                        onChange={(e) => handleUpdateRoutine(item.id, 'sets', parseInt(e.target.value) || 1)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">Reps</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" max="100"
                                                        value={item.reps}
                                                        onChange={(e) => handleUpdateRoutine(item.id, 'reps', parseInt(e.target.value) || 1)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center uppercase tracking-wider">
                                                        <FiClock className="mr-1" /> Rest (s)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="0" step="15"
                                                        value={item.restSeconds}
                                                        onChange={(e) => handleUpdateRoutine(item.id, 'restSeconds', parseInt(e.target.value) || 0)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions (Reorder + Delete) */}
                                        <div className="flex sm:flex-col justify-end items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-200 sm:pl-4">
                                            <button 
                                                onClick={() => handleMoveItem(index, 'up')}
                                                disabled={index === 0}
                                                className={`p-2 rounded-md transition ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                                            >
                                                <FiArrowUp className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleMoveItem(index, 'down')}
                                                disabled={index === routine.length - 1}
                                                className={`p-2 rounded-md transition ${index === routine.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                                            >
                                                <FiArrowDown className="w-5 h-5" />
                                            </button>
                                            <div className="flex-1 sm:hidden"></div>
                                            <button 
                                                onClick={() => handleRemoveExercise(item.id)}
                                                className="p-2 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                                title="Remove exercise"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutBuilder;
