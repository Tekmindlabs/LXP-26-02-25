import { type FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building } from "@prisma/client";

interface BuildingSummaryProps {
  building: Building & {
    floors: Array<{
      id: string;
      name: string;
      wings: Array<{
        id: string;
        name: string;
        rooms: Array<{
          id: string;
          name: string;
        }>;
      }>;
    }>;
  };
}

export const BuildingSummary: FC<BuildingSummaryProps> = ({ building }) => {
  const totalFloors = building.floors.length;
  const totalWings = building.floors.reduce((acc, floor) => acc + floor.wings.length, 0);
  const totalRooms = building.floors.reduce((acc, floor) => 
    acc + floor.wings.reduce((wingAcc, wing) => wingAcc + wing.rooms.length, 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalFloors}</div>
          <p className="text-sm text-muted-foreground">Total Floors</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalWings}</div>
          <p className="text-sm text-muted-foreground">Total Wings</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalRooms}</div>
          <p className="text-sm text-muted-foreground">Total Rooms</p>
        </CardContent>
      </Card>

      <div className="md:col-span-3">
        <h3 className="text-lg font-medium mb-4">Building Structure</h3>
        <div className="space-y-4">
          {building.floors.map((floor) => (
            <Card key={floor.id}>
              <CardContent className="pt-6">
                <h4 className="font-medium">{floor.name}</h4>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {floor.wings.map((wing) => (
                    <div key={wing.id} className="space-y-2">
                      <h5 className="text-sm font-medium">{wing.name}</h5>
                      <ul className="text-sm text-muted-foreground">
                        {wing.rooms.map((room) => (
                          <li key={room.id}>{room.name}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
