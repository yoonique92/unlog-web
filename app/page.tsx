import HomeFortuneDraw from "../components/home/HomeFortuneDraw";

export default function Home() {
  return (
    <main className="home-mobile-slot home-mobile-background h-full min-h-0 bg-[#D8A469] bg-[url('/image/home/home-background-mobile.png')] bg-cover bg-center bg-no-repeat sm:min-h-[720px]">
      <div className="home-mobile-background relative h-full min-h-0 overflow-hidden bg-[#F4C98F] bg-[url('/image/home/home-background-mobile.png')] bg-cover bg-center bg-no-repeat sm:min-h-[720px]">
        <HomeFortuneDraw />
      </div>
    </main>
  );
}
