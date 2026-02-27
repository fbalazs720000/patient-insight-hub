
-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taj_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  place_of_birth TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patients"
ON public.patients FOR SELECT TO authenticated USING (true);

-- Medical records
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT,
  notes TEXT,
  doctor_name TEXT,
  record_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medical_records"
ON public.medical_records FOR SELECT TO authenticated USING (true);

-- Patient PDFs
CREATE TABLE public.patient_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patient_pdfs"
ON public.patient_pdfs FOR SELECT TO authenticated USING (true);

-- Profiles for doctors
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample patient data
INSERT INTO public.patients (taj_number, full_name, date_of_birth, gender, place_of_birth, address, phone)
VALUES 
  ('123-456-789', 'John Smith', '1985-03-15', 'Male', 'Budapest', '123 Main St, Budapest', '+36 1 234 5678'),
  ('987-654-321', 'Jane Doe', '1990-07-22', 'Female', 'Debrecen', '456 Oak Ave, Debrecen', '+36 1 876 5432');

-- Insert sample medical records
INSERT INTO public.medical_records (patient_id, diagnosis, treatment, notes, doctor_name, record_date)
SELECT p.id, 'Hypertension Stage 2', 'Prescribed Lisinopril 10mg daily', 'Blood pressure consistently elevated at 160/100. Recommended lifestyle changes.', 'Dr. Kovács', '2025-06-15'
FROM public.patients p WHERE p.taj_number = '123-456-789';

INSERT INTO public.medical_records (patient_id, diagnosis, treatment, notes, doctor_name, record_date)
SELECT p.id, 'Type 2 Diabetes', 'Metformin 500mg twice daily', 'HbA1c at 7.8%. Diet and exercise plan discussed.', 'Dr. Szabó', '2025-09-20'
FROM public.patients p WHERE p.taj_number = '123-456-789';

INSERT INTO public.medical_records (patient_id, diagnosis, treatment, notes, doctor_name, record_date)
SELECT p.id, 'Seasonal Allergies', 'Cetirizine 10mg as needed', 'Symptoms include sneezing, runny nose. Allergy testing recommended.', 'Dr. Nagy', '2025-11-10'
FROM public.patients p WHERE p.taj_number = '987-654-321';
