from ortools.sat.python import cp_model

def solve_teacher_student_matching(students, teachers, all_slots):
    model = cp_model.CpModel()
    
    x = {}
    drop = {}
    
    # 1. VARIABLE CREATION & PRE-FILTERING
    for s_id, s_info in students.items():
        drop[s_id] = model.NewBoolVar(f'drop_{s_id}')
        s_subject = s_info['subject']
        s_available = set(s_info['available'])
        
        for t_id, t_info in teachers.items():
            if s_subject in t_info['subjects']:
                common_slots = s_available & set(t_info['available'])
                for h in common_slots:
                    x[(s_id, t_id, h, s_subject)] = model.NewBoolVar(f'match_{s_id}_{t_id}_{h}_{s_subject}')

    # 2. CONSTRAINTS
    for s_id in students:
        student_vars = [v for (s, t, h, j), v in x.items() if s == s_id]
        model.Add(sum(student_vars) + drop[s_id] == 1)

    for t_id in teachers:
        for h in all_slots:
            teacher_slot_vars = [v for (s, t, hr, j), v in x.items() if t == t_id and hr == h]
            model.Add(sum(teacher_slot_vars) <= 1)

    for t_id, t_info in teachers.items():
        teacher_total_vars = [v for (s, t, h, j), v in x.items() if t == t_id]
        model.Add(sum(teacher_total_vars) <= t_info['capacity'])

    # 3. OBJECTIVE
    DROP_PENALTY = 1000 
    obj_matches = []
    for (s, t, h, j), var in x.items():
        pref_score = students[s]['preferences'].get(t, 1)
        obj_matches.append(var * pref_score)
        
    obj_drops = [drop[s_id] * DROP_PENALTY for s_id in students]
    model.Maximize(sum(obj_matches) - sum(obj_drops))

    # 4. SOLVER
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    # 5. RESULTS OUTPUT
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        matched_results = []
        unmatched_students = []
        for s_id in students:
            if solver.Value(drop[s_id]):
                unmatched_students.append(s_id)
            else:
                for (s, t, h, j), var in x.items():
                    if s == s_id and solver.Value(var):
                        matched_results.append({
                            "student": s, "teacher": t, "slot": h, "subject": j
                        })
        return matched_results, unmatched_students
    else:
        return None, "No solution found even with drops."

# --- MAIN EXECUTION BLOCK ---
def main():
    """
    Main entry point for the script. 
    Define your data here and trigger the solver.
    """
    # 1. Define Data
    slots = ['Mon9', 'Mon10', 'Tue9']
    
    teachers_data = {
        'T1': {'subjects': ['Math'], 'available': ['Mon9', 'Mon10'], 'capacity': 2},
        'T2': {'subjects': ['Physics'], 'available': ['Mon9'], 'capacity': 1}
    }
    
    students_data = {
        'Alice': {'subject': 'Math', 'available': ['Mon9'], 'preferences': {'T1': 10}},
        'Bob': {'subject': 'Math', 'available': ['Mon9'], 'preferences': {'T1': 10}},
        'Charlie': {'subject': 'Physics', 'available': ['Mon9'], 'preferences': {'T2': 10}}
    }

    # 2. Run Solver
    print("Starting solver...")
    matches, drops = solve_teacher_student_matching(students_data, teachers_data, slots)

    # 3. Print Results
    if matches is not None:
        print("\n✅ MATCHES FOUND:")
        print("-" * 30)
        for m in matches:
            print(f"👤 {m['student']:<8} ➔ 🏫 {m['teacher']} at 🕒 {m['slot']} [{m['subject']}]")
        
        if drops:
            print("\n❌ STUDENTS DROPPED (No feasible slot/capacity):")
            print("-" * 30)
            for d in drops:
                print(f"⚠️ {d}")
        else:
            print("\n✨ All students matched successfully!")
    else:
        print(f"Error: {drops}")

if __name__ == "__main__":
    main()