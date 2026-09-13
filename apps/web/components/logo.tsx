import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="./cluster-logo.svg"
        width={48}
        height={48}
        alt="cluster-logo"
      />
    </div>
  );
}
